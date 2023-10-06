const puppeteer = require('puppeteer');
const Xvfb = require('xvfb');

const _convertNumber = (str) => {
  str = str.replace(/</g, '');
  if (str.indexOf('b') != -1) {
    str = str.replace(/b/g, '');
    str = parseFloat(str)
    str *= 1000
    str *= 1000
    str *= 1000
  }
  else if (str.indexOf('m') != -1) {
    str = str.replace(/m/g, '');
    str = parseFloat(str)
    str *= 1000
    str *= 1000
  }
  else if (str.indexOf('k') != -1) {
    str = str.replace(/k/g, '');
    str = parseFloat(str)
    str *= 1000
  }
  else {
    str = parseFloat(str)
  }
  return str
}

const _filterData = (prefix, arr) => {
  var ret = [];
  for (var x in arr) {
    var assets = arr[x].pool.split('/');
    var fee = arr[x].fee.replace(/%/g, '');
    var tvl = arr[x].tvl.replace(/\$/g, '');
    tvl = _convertNumber(tvl);
    var volume24 = arr[x].volume24.replace(/\$/g, '');
    volume24 = _convertNumber(volume24);

    var tmp = {
      id: prefix + '-' + assets[0] + '-' + assets[1] + '-' + fee,
      address: arr[x].address.toLowerCase(),
      apr: volume24 * fee * 365 / (100 * tvl)
    }
    ret.push(tmp)
  }
  return ret;
}

const getUniSwapV3Info = async () => {
  try {
    const url = "https://info.uniswap.org/#/pools";
  
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


    await page.waitForSelector("div.sc-brqgnP a.sc-fYiAbW");

    var allData = []
    var allAddress = []

    var poolCnt = 0;
    do {
      var data = await page.$$eval('div.sc-brqgnP a.sc-fYiAbW', (divObjs) => {
        var data = []
        for (var x in divObjs) {
          var pool = divObjs[x].querySelectorAll('div.sc-chPdSV')[2].textContent
          var fee = divObjs[x].querySelectorAll('div.sc-jKJlTe.sc-gipzik.sc-fAjcbJ.dsySXo')[0].textContent
          var tvl = divObjs[x].querySelectorAll('div.sc-chPdSV')[3].textContent
          var volume24 = divObjs[x].querySelectorAll('div.sc-chPdSV')[4].textContent
          var address = divObjs[x].getAttribute('href')
          address = address.split('/')
          address = address[address.length - 1];
          data.push({
            pool: pool,
            fee: fee,
            tvl: tvl,
            volume24: volume24,
            address: address
          })
        }
        return data
      });

      var nextBtn = await page.$$eval('div.sc-iujRgT.cVwlxW > div:last-of-type > div.sc-GMQeP.hXYrmI', btnObjs => btnObjs.length)
      if (nextBtn > 0) {
        await page.click('div.sc-iujRgT.cVwlxW > div:last-of-type > div.sc-GMQeP.hXYrmI')
        await new Promise(function (resolve) {
          setTimeout(resolve, 3000)
        });
      }

      poolCnt = data.length;

      if ((poolCnt > 0 && allAddress.indexOf(data[0].address) != -1)) break;
      else if (data.length > 0 && allAddress.indexOf(data[0].address) == -1) {
        allAddress.push(data[0].address)
      }
      allData = allData.concat(data);
    } while (poolCnt > 0);
    
    
    allData = _filterData("ETHUNI3", allData);

    browser.close();
    xvfb.stop();

    return { state: 'ok', data: allData }
  } catch (error) {
    return { state: 'err', code: error.toString() }
  }
};

const run = async() => {
  var data = await getUniSwapV3Info();
  console.log(data)
}

run()
