/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import { Builder, Browser, By, until } from 'selenium-webdriver';
import { ServiceBuilder } from 'selenium-webdriver/chrome';
const chromedriverPath = require('chromedriver').path.replace(
  'app.asar',
  'app.asar.unpacked',
);
const serviceBuilder = new ServiceBuilder(chromedriverPath);
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

          // try {
          //   await driver.findElement(
          //     By.xpath(
          //       "//*[contains(text(), 'Phone number shared via url is invalid.')]",
          //     ),
          //   );
          //   logs.push(`number ${numbers[i]} is invalid`);
          // } catch (e) {}
          // try {
          // await driver.wait(
          //   until.elementLocated(By.css('span[data-icon="smiley"]')),
          //   30 * 1000,
          // );
          if (video) {
            const attach = await driver.findElement(
              By.xpath("//div[@title='Attach']"),
            );
            attach.click();
            const uploadElement = await driver.findElement(
              By.css(
                'input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]',
              ),
            );
            await uploadElement.sendKeys(video);
            await driver.sleep(2000);
          }
          const sendBtn = await driver.findElement(
            By.css('span[data-icon="send"]'),
          );
          await sendBtn.click();
          // const loading = await driver.wait(
          //   until.elementLocated(By.css('span[data-icon="msg-time"]')),
          //   1000000,
          // );
          // wait for loading element to disappear
          // await driver.wait(until.stalenessOf(loading), 1000000);

          await driver.sleep(10000);

          logs.push(`number ${numbers[i]} sent`);
          countDone += 1;
          // } catch (error) {
          //   logs.push(`number ${numbers[i]} is invalid`);
          //   continue;
          // }
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
  } catch (e) {
    logs.push(e?.message);
    return logs;
  }
}
