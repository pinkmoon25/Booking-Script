import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import { exec } from "child_process";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
  'Cookie': 'ASP.NET_SessionId=odyjza0me0xhuarxj4l34muz',
  'DNT': '1',
  'Host': 'ddasports.com',
  'Referer': 'https://ddasports.com/app/Booking',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Linux"'
}

const payload = {
  '__EVENTTARGET': '',
  '__EVENTARGUMENT': '',
  '__LASTFOCUS': '',
  '__VIEWSTATE': '',
  '__VIEWSTATEGENERATOR': '',
  '__EVENTVALIDATION': '',
  'ctl00$MainContent$txtBookingDate': '',
  'ctl00$MainContent$ddlGames': '',
  'ctl00$MainContent$ddlBookedBy': '',
  'ctl00$MainContent$ddlConfirmationBy': '',
  'ctl00$MainContent$hdnbookingOrdno': '',
  'ctl00$MainContent$hdnMemberId': '',
  'ctl00$MainContent$hdnMemberNo': '',
  'ctl00$MainContent$hdnComplexId': '',
  'ctl00$MainContent$hdnSlotTime': '',
  'ctl00$MainContent$hdnAmt': '',
  'ctl00$MainContent$hdnTaxAmt': '',
  'ctl00$MainContent$hdnTotAmt': '',
  'ctl00$MainContent$hdnSMScharge': '',
  'ctl00$MainContent$hdnMemEmail': '',
  'ctl00$MainContent$hdnFrom': '',
  'ctl00$MainContent$hdnTo': '',
  'ctl00$MainContent$hdnPlayerId': '',
  'ctl00$MainContent$hdnCrtTbl': '',
  'ctl00$MainContent$hdnPrimeTime': '',
  'ctl00$MainContent$hdnSelect': '',
  'ctl00$MainContent$hdnPlayers': ''
};

const payload2 = {};

function parseHtml(html) {
  const $ = cheerio.load(html);
  const viewState = $('#__VIEWSTATE').val();
  const eventValidation = $('#__EVENTVALIDATION').val();
  const viewStateGenerator = $('#__VIEWSTATEGENERATOR').val();
  return { viewState, eventValidation, viewStateGenerator };
}

function getTImeSlots(html) {
  const $ = cheerio.load(html);
  const inputs = $('input[id^="MainContent_grdGameSlot_hdnTimeFrom_"], ' +
    'input[id^="MainContent_grdGameSlot_hdnTimeTo_"], ' +
    'input[id^="MainContent_grdGameSlot_hdnmaxpalyers_"], ' +
    'input[id^="MainContent_grdGameSlot_hdnId_"], ' +
    'input[id^="MainContent_grdGameSlot_hdnreserved_"]');
  // Loop through selected inputs
  inputs.each((_, element) => {
    const $input = $(element);
    const name = $input.attr('name');
    const value = $input.val();
    // Add the name and value to the payload object
    payload2[name] = value;
  });

  return payload2;
}

function getFacilityData(html) {
  const $ = cheerio.load(html);
  const slot = $('#MainContent_hdnSlotTime').val();
  const playerId = $('#MainContent_hdnPlayerId').val();
  const select = $('#MainContent_hdnSelect').val();

  const captchaSrc = $('#MainContent_imgCaptchaImage').attr('src');
  const captcha = captchaSrc.slice(-5);

  return { slot, captcha, playerId, select };
}

function getPaymentPage(html) {
  const filePath = path.join(__dirname, 'temp.html');
  fs.writeFileSync(filePath, html, 'utf8');

  // Open the temporary file in the default browser
  const openCommand = process.platform === 'darwin' ? 'open' :
    process.platform === 'win32' ? 'start' :
      'xdg-open';

  exec(`${openCommand} "${filePath}"`, (err) => {
    if (err) {
      console.error('Error opening the HTML file:', err);
    } else {
      console.log('HTML file opened in the default browser.');
    }
  });
}

async function getPageData() {
  const response = await fetch('https://ddasports.com/app/Booking', {
    method: 'GET',
    headers: headers
  });
  const html = await response.text();

  return parseHtml(html);
}

async function postGameReq() {
  const { viewState, eventValidation, viewStateGenerator } = await getPageData();
  const payload_data = {
    ...payload,
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    __EVENTTARGET: 'ctl00$MainContent$ddlGames',
    ctl00$MainContent$txtBookingDate: "29-08-2024",
    ctl00$MainContent$ddlGames: '20',
    ctl00$MainContent$ddlBookedBy: '43049|M',
    ctl00$MainContent$ddlConfirmationBy: 'Email',
    ctl00$MainContent$hdnComplexId: 'HNSC'
  }
  const response = await fetch('https://ddasports.com/app/Booking', {
    method: 'POST',
    headers: headers,
    body: new URLSearchParams(payload_data)
  })
  const html = await response.text();

  return parseHtml(html);
}

async function postGameCatogory() {
  const { viewState, eventValidation, viewStateGenerator } = await postGameReq();
  const payload_data = {
    ...payload,
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    __EVENTTARGET: 'ctl00$MainContent$ddlGameCategory',
    ctl00$MainContent$txtBookingDate: "29-08-2024",
    ctl00$MainContent$ddlGames: '20',
    ctl00$MainContent$ddlGameCategory: '201',
    ctl00$MainContent$ddlBookedBy: '43049|M',
    ctl00$MainContent$ddlConfirmationBy: 'Email',
    ctl00$MainContent$hdnComplexId: 'HNSC'
  }
  const response = await fetch('https://ddasports.com/app/Booking', {
    method: 'POST',
    headers: headers,
    body: new URLSearchParams(payload_data)
  })
  const html = await response.text();

  return parseHtml(html);
}

async function getSlotAvailability() {
  const { viewState, eventValidation, viewStateGenerator } = await postGameCatogory();
  const payload_data = {
    ...payload,
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    ctl00$MainContent$txtBookingDate: "29-08-2024",
    ctl00$MainContent$ddlGames: '20',
    ctl00$MainContent$ddlGameCategory: '201',
    ctl00$MainContent$ddlGameSubCategory: '100',
    ctl00$MainContent$ddlBookedBy: '43049|M',
    ctl00$MainContent$ddlConfirmationBy: 'Email',
    ctl00$MainContent$btnSearch: 'Search',
    ctl00$MainContent$hdnComplexId: 'HNSC'
  }
  const response = await fetch('https://ddasports.com/app/Booking', {
    method: 'POST',
    headers: headers,
    body: new URLSearchParams(payload_data)
  })
  const html = await response.text();

  return [parseHtml(html), getTImeSlots(html)];
}

async function bookSlot() {
  const [state, updatedPayload] = await getSlotAvailability();
  const { viewState, eventValidation, viewStateGenerator } = state;
  const payload_data = {
    __EVENTTARGET: 'ctl00$MainContent$grdGameSlot$ctl08$lnkEdit',
    __EVENTARGUMENT: '',
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    ...updatedPayload,
    ctl00$MainContent$hdnbookingOrdno: '',
    ctl00$MainContent$hdnMemberId: '',
    ctl00$MainContent$hdnMemberNo: '',
    ctl00$MainContent$hdnComplexId: 'HNSC',
    ctl00$MainContent$hdnSlotTime: '',
    ctl00$MainContent$hdnAmt: '',
    ctl00$MainContent$hdnTaxAmt: '',
    ctl00$MainContent$hdnTotAmt: '',
    ctl00$MainContent$hdnSMScharge: '',
    ctl00$MainContent$hdnMemEmail: '',
    ctl00$MainContent$hdnFrom: '',
    ctl00$MainContent$hdnTo: '',
    ctl00$MainContent$hdnPlayerId: '',
    ctl00$MainContent$hdnCrtTbl: '',
    ctl00$MainContent$hdnPrimeTime: '',
    ctl00$MainContent$hdnSelect: '',
    ctl00$MainContent$hdnPlayers: ''
  }

  const response = await fetch('https://ddasports.com/app/Booking', {
    method: 'POST',
    headers: headers,
    body: new URLSearchParams(payload_data)
  })
  const html = await response.text();

  return [parseHtml(html), getTImeSlots(html), getFacilityData(html)];
}

async function bookFacility() {
  const [state, updatedPayload, facilityData] = await bookSlot();
  const { viewState, eventValidation, viewStateGenerator } = state;
  const { slot, captcha, playerId, select } = facilityData;
  const payload_data = {
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    __VIEWSTATE: viewState,
    __EVENTVALIDATION: eventValidation,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    ...updatedPayload,
    ctl00$MainContent$hdnbookingOrdno: '',
    ctl00$MainContent$txtCpCode: `${captcha}`,
    ctl00$MainContent$btnSave: 'Book Facility',
    ctl00$MainContent$hdnMemberId: '',
    ctl00$MainContent$hdnMemberNo: 'j- 20',
    ctl00$MainContent$hdnComplexId: 'HNSC',
    ctl00$MainContent$hdnSlotTime: `${slot}`,
    ctl00$MainContent$hdnAmt: '',
    ctl00$MainContent$hdnTaxAmt: '',
    ctl00$MainContent$hdnTotAmt: '',
    ctl00$MainContent$hdnSMScharge: '0',
    ctl00$MainContent$hdnMemEmail: '',
    ctl00$MainContent$hdnFrom: '',
    ctl00$MainContent$hdnTo: '',
    ctl00$MainContent$hdnPlayerId: `${playerId}`,
    ctl00$MainContent$hdnCrtTbl: '',
    ctl00$MainContent$hdnPrimeTime: '',
    ctl00$MainContent$hdnSelect: `${select}`,
    ctl00$MainContent$hdnPlayers: ''
  }

  const response = await fetch('https://ddasports.com/app/Booking', {
    method: 'POST',
    headers: headers,
    body: new URLSearchParams(payload_data)
  })
  const html = await response.text();
  getPaymentPage(html);
}

bookFacility();
