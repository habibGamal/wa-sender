/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { Builder, Browser, By, until } from 'selenium-webdriver';
import { ServiceBuilder,Options } from 'selenium-webdriver/chrome';

const chromedriverPath = require('chromedriver').path.replace(
  'app.asar',
  'app.asar.unpacked',
);

const serviceBuilder = new ServiceBuilder(chromedriverPath);
const options = new Options();
// options.addArguments('--headless');
export default async function sender(
  numbers: string[],
  message: string,
  video?: string,
) {
  const logs = [];
  try {
    const driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeService(serviceBuilder)
      .setChromeOptions(options)
      .build();
    let countDone = 0;
    try {
      await driver.get('https://web.whatsapp.com');
      // aria-label="Chat list"
      await driver.wait(
        until.elementLocated(
          By.xpath("//*[contains(text(), 'Search or start new chat')]"),
        ),
        10000000000,
      );
      await driver.manage().setTimeouts({ implicit: 30 * 1000 });

      for (let i = 0; i < numbers.length; i++) {
        try {
          if (numbers[i].toString().startsWith('01')) {
            numbers[i] = `2${numbers[i]}`;
          }
          await driver.get(
            `https://web.whatsapp.com/send/?phone=${numbers[i]}&text=${message}`,
          );
          logs.push(
            `https://web.whatsapp.com/send/?phone=${numbers[i]}&text=${message}`,
          );
          if (video) {
            console.log('title');
            const attach = await driver.findElement(
              By.css('div[title="Attach"]'),
            );
            console.log('click title');
            await attach.click();

            console.log('upload element');
            const uploadElement = await driver.findElement(
              By.css(
                'input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]',
              ),
            );

            console.log('upload element send key');
            await uploadElement.sendKeys(video);
            await driver.sleep(2000);
          }
          console.log('send btn');
          const sendBtn = await driver.findElement(
            By.css('span[data-icon="send"]'),
          );
          console.log('send btn click');
          await sendBtn.click();
          await driver.sleep(10000);

          logs.push(`number ${numbers[i]} sent`);
          countDone += 1;
        } catch (e) {
          logs.push(e?.message);
          logs.push(`number ${numbers[i]} is invalid`);
          continue;
        }
      }
    } catch (error: any) {
      const errMsg = error?.messaage || 'unexpected error occured';
      logs.push(errMsg);
      logs.push(error?.toString());
      logs.push(`sent ${countDone} messages from ${numbers.length}`);
      logs.push(`failed to send ${numbers.length - countDone} messages`);
      await driver.quit();
      return logs;
    } finally {
      await driver.quit();
      logs.push(`sent ${countDone} messages from ${numbers.length}`);
      logs.push(`failed to send ${numbers.length - countDone} messages`);
      return logs;
    }
  } catch (e: any) {
    logs.push(e?.message);
    return logs;
  }
}
