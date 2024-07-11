import { exec } from 'child_process';
import path from 'path';

const batFilePath = path.join(__dirname, 'update_driver.bat');

// The argument you want to pass

export default async function updateChromeDriver(message: string) {
  let argument = getVersionRequiredFromERR(message) || '126.0.6478.127';
  exec(`"${batFilePath}" ${argument}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
}

function getVersionRequiredFromERR(message: string) {
  const regex = /Current browser version is (\d+\.\d+\.\d+\.\d+)/;
  const match = message.match(regex);
  return match ? match[1] : null;
}
