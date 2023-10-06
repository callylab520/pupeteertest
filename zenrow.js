require('dotenv').config()
const { ZenRows } = require("zenrows");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const getTokenInfo = async() => {
  const client = new ZenRows(process.env.ZENROW);
  const url = "https://etherscan.io/tokens";

  try {
    const { data } = await client.get(url, {});

    const dom = new JSDOM(data)
    const tokenList = dom.window.document.querySelectorAll("#ContentPlaceHolder1_divERC20Tokens tbody tr")
    var topTokens = Array.from(tokenList).map((token) => {
      return {
        name: token.querySelector('td:nth-child(2) .hash-tag.text-truncate.fw-medium').innerHTML,
        address: token.querySelector('td:nth-child(2) a:first-child').getAttribute('href').slice(7),
        price: token.querySelector('td:nth-child(3) .d-inline').getAttribute('data-bs-title'),
        change: token.querySelector('td:nth-child(4)').textContent.trim()
      };
    })
    return topTokens;
  } catch (error) {
    console.error(error.message);
    if (error.response) {
      console.error(error.response.data);
    }
  }
}

const run = async() => {
  var ret = await getTokenInfo();
  console.log(ret)
}

run()