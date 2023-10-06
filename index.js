const puppeteer = require('puppeteer');
const Xvfb = require('xvfb');

const getUniSwapV3Info = async () => {
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


    await page.waitForSelector('#ContentPlaceHolder1_tblErc20Tokens');
    var topTokens = await page.evaluate(() => {
      const tokenList = document.querySelectorAll('#ContentPlaceHolder1_tblErc20Tokens tbody tr');
      return Array.from(tokenList).map((token) => {
        return {
          name: token.querySelector('td:nth-child(2) .hash-tag.text-truncate.fw-medium').innerHTML,
          address: token.querySelector('td:nth-child(2) a:first-child').getAttribute('href').slice(7),
          price: token.querySelector('td:nth-child(3) .d-inline').getAttribute('data-bs-title'),
          change: token.querySelector('td:nth-child(4) span')?.innerText ||
            token.querySelector('td:nth-child(4)')?.innerHTML
        };
      });
    });


    browser.close();
    xvfb.stop();

    return { state: 'ok', data: topTokens }
  } catch (error) {
    return { state: 'err', code: error.toString() }
  }
};

const run = async() => {
  var data = await getUniSwapV3Info();
  console.log(data)
}

run()
