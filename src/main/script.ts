/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { Builder, Browser, By, until, WebDriver } from 'selenium-webdriver';
import { ServiceBuilder, Options } from 'selenium-webdriver/chrome';
import fs from 'fs';
import updateChromeDriver from './updateChromeDriver';

// const chromedriverPath = require('chromedriver').path.replace(
//   'app.asar',
//   'app.asar.unpacked',
// );
const chromedriverPath = 'C:\\chromedriver\\chromedriver-win64\\chromedriver.exe'
const profilePath =
  '--user-data-dir=C:\\Users\\habib\\AppData\\Local\\Google\\Chrome\\roby8';

let logs: string[] = [];
const eventLog = (event: Electron.IpcMainEvent) =>
  function logMessage(msg: string) {
    if (
      logs.length > 0 &&
      logs[logs.length - 1].startsWith('Progress:') &&
      msg.startsWith('Progress:')
    ) {
      logs[logs.length - 1] = msg;
    } else logs.push(msg);
    event.reply('form-submission', JSON.stringify(logs));
  };

const eventProgress = (event: Electron.IpcMainEvent) =>
  function logMessage(msg: string) {
    event.reply('form-submission', JSON.stringify([...logs, msg]));
  };

let driver: WebDriver;

export async function stopSender() {
  console.log('stopping',driver)
  if (driver) {
    await driver.close();
  }
}

export async function login() {
  try {
    const serviceBuilder = new ServiceBuilder(chromedriverPath);
    const options = new Options();
    options.addArguments(profilePath);
    const driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeService(serviceBuilder)
      .setChromeOptions(options)
      .build();
    await driver.get('https://web.whatsapp.com');
    await driver.sleep(50000000);
  } catch (e: any) {
    updateChromeDriver(e.message);
  }
}

export default async function sender(
  event: Electron.IpcMainEvent,
  numbers: string[],
  startFrom: number,
  message: string,
  videos?: string[],
) {
  logs = [];
  const logMessage = eventLog(event);
  const logProgress = eventProgress(event);
  const refinedNumbers = refineNumbers(numbers);
  try {
    const serviceBuilder = new ServiceBuilder(chromedriverPath);
    const options = new Options();
    options.addArguments(profilePath);
    // options.addArguments('--headless=new');
    driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeService(serviceBuilder)
      .setChromeOptions(options)
      .build();
    try {
      logMessage('Starting...');
      logMessage('Refined Numbers: ' + refinedNumbers.length);
      await driver.get('https://web.whatsapp.com');
      await waitForAppLoading(driver);
      // await driver.sleep(5000000);
      const isAuthorized = await checkAuth(driver);
      if (!isAuthorized) {
        logMessage('Not authorized: please login first');
        return;
      }
      logMessage('You are authorized successfully');
      logMessage('Loading Chats');
      await waitForChatScreen(driver);
      logMessage('Chats loaded Successfully');
      for (let i = startFrom; i < refinedNumbers.length; i++) {
        try {
          console.log('send to ', refinedNumbers[i]);
          await sendTo(driver, logMessage, refinedNumbers[i], message, videos);
          logMessage(`Progress: Done ${i + 1} of ${refinedNumbers.length}`);
        } catch (error: any) {
          // handle NoSuchSessionError
          if (
            error?.message.includes(
              'This driver instance does not have a valid session ID',
            ) ||
            error?.message.includes('invalid session id')
          ) {
            logMessage('Session Expired');
            break;
          }
          logMessage(error?.message);
          console.log(error);
        }
      }
    } catch (error: any) {
      console.log('error', error);
      logMessage(error?.message);
    } finally {
      logMessage('Finished');
      driver.quit();
    }
  } catch (e: any) {
    console.log('error', e);
    logMessage(e?.message);
  }
}
const TIMEOUT = 30 * 1000;
async function sendTo(
  driver: WebDriver,
  logMessage: (msg: string) => void,
  number: string,
  message: string,
  videos?: string[],
) {
  await driver.get(
    `https://web.whatsapp.com/send/?phone=${number}&text=${message}`,
  );
  console.log('loading page');
  await waitForChatLoading(driver);
  console.log('app loaded');
  const isNumberValid = await isValidNumber(driver);
  console.log('validate number');
  if (isNumberValid === false) {
    logMessage(`Invalid Number: ${number}`);
    return;
  }
  console.log('number is valid');
  await sendJustText(driver);

  if (videos) {
    for (const video of videos) {
      await sendAttatchment(driver, video);
    }
  }
}
async function sendAttatchment(driver: WebDriver, attachment: string) {
  const attach = await driver.wait(
    until.elementLocated(By.css('div[title="Attach"]')),
    TIMEOUT,
  );
  await attach.click();
  console.log('upload element');
  const uploadElement = await driver.wait(
    until.elementLocated(
      By.css('input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]'),
    ),
    TIMEOUT,
  );
  console.log('upload element send key');
  await uploadElement.sendKeys(attachment);
  await sendWithAttachment(driver);
}

async function isValidNumber(driver: WebDriver) {
  try {
    await driver.wait(
      until.elementLocated(By.css('div[title="Attach"]')),
      2000,
    );
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function waitMsgToBeSent(driver: WebDriver) {
  const msgLoader = await driver.wait(
    until.elementLocated(By.css('span[data-icon="msg-time"]')),
    TIMEOUT,
  );
  await driver.wait(until.stalenessOf(msgLoader), TIMEOUT);
}

async function sendWithAttachment(driver: WebDriver) {
  const sendBtn = await driver.wait(
    until.elementLocated(By.css('div[role="button"] span[data-icon="send"]')),
    TIMEOUT,
  );
  await sendBtn.click();
  await waitMsgToBeSent(driver);
}

async function sendJustText(driver: WebDriver) {
  const sendBtn = await driver.wait(
    until.elementLocated(By.css('span[data-icon="send"]')),
    TIMEOUT,
  );
  await sendBtn.click();
  await waitMsgToBeSent(driver);
}

function refineNumbers(numbers: string[]) {
  const list = numbers.map((number: string) => {
    let refindedNumber = number.toString().replaceAll(' ', '').replace('+', '');
    if (refindedNumber.startsWith('01')) {
      refindedNumber = `2${refindedNumber}`;
    }
    return refindedNumber;
  });
  // remove duplicates
  return [...new Set(list)];
}

async function checkAuth(driver: WebDriver) {
  try {
    await driver.findElement(By.css('div[id="initial_startup"]'));
    return false;
  } catch (e) {
    return true;
  }
}

async function waitForAppLoading(driver: WebDriver) {
  await driver.wait(until.elementLocated(By.css('div[id="app"]')), TIMEOUT);
}

async function waitForChatLoading(driver: WebDriver) {
  try {
    await driver.switchTo().alert().accept();
  } catch (e) {
    console.log(e);
  }
  const starting = await driver.wait(
    until.elementLocated(By.xpath('//*[text()="Starting chat"]')),
    TIMEOUT,
  );
  await driver.wait(until.stalenessOf(starting), TIMEOUT);
}

async function waitForChatScreen(driver: WebDriver) {
  await driver.wait(
    until.elementLocated(
      // button aria-label="Search or start new chat"
      By.css('button[aria-label="Search or start new chat"]'),
    ),
    TIMEOUT,
  );
}
