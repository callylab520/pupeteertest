const puppeteer = require('puppeteer');
const Xvfb = require('xvfb');

const getEthereumTokenInfo = async () => {
  try {
    const url = "https://etherscan.io/tokens";
  
    var xvfb = new Xvfb({
      silent: true,
      xvfb_args: ["-screen", "0", '1280x720x24', "-ac"],
    });
    xvfb.start((err)=>{if (err) console.error(err)});

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--start-fullscreen', '--display='+xvfb._display]
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(url, {waitUntil: 'networkidle2'});

    console.log("1 ================")
    await page.screenshot({
      path: 'screenshot1.jpg'
    });

    await page.evaluate(() => {
      var el = document.querySelector('#challenge-form')
      if (el != null) {
        el.submit();
      }
    });
    console.log("2 ================")
    await page.screenshot({
      path: 'screenshot2.jpg'
    });

    await page.waitForNavigation();

    console.log("3 ================")
    await page.screenshot({
      path: 'screenshot3.jpg'
    });

    browser.close();
    xvfb.stop();

    return { state: 'ok' }
  } catch (error) {
    return { state: 'err', code: error.toString() }
  }
};

const run = async() => {
  var data = await getEthereumTokenInfo();
  console.log(data)
}

run()
