// 全国主要地点の週間天気予報
// Wep scraping by node.js
// Soomin K., Dec.20, 2018
// for dynamics web site, need to use Google's puppeteer

const rp = require('request-promise');
const cheerio = require('cheerio');
const url = 'https://www.jma.go.jp/jp/week/index.html';

rp(url)
  .then(html => {
    // success!
    const $ = cheerio.load(html);

    // get the main forecast table from the page
    const fT = $('table[class=forecastlist]');
    if (!fT) {
      console.log('Forecast table not found!');
      return;
    }

    // caption contains the report time, for example:
    // 12月20日17時　全国主要地点の週間天気予報
    const caption = fT.children('caption').text();
    console.log(caption);

    // get only the first row of the data columns
    fT.find('tbody > tr').first().children('th').each((k, e) => {
      console.log(k, $(e).text());
      }
    );

    let area = [];
    fT.find('td[class=area]').each((i, elem) => {
      area[i] = $(elem).text().trim();  // trim to remove /n
      console.log('area #####', i, area[i]);
      let title   = [];
      let mintemp = [];
      let maxtemp = [];
      let pop     = [];
      $(elem).siblings('td[class=forecast]').each((j, el) => {
        title[j]   = $(el).children('img').attr('title');          // status
        mintemp[j] = $(el).children('font[class=mintemp]').text(); // low temp
        maxtemp[j] = $(el).children('font[class=maxtemp]').text(); // high temp
        pop[j]     = $(el).children('font[class=pop]').text();     // rain possibility
      });
      console.log('title  :', title);
      console.log('mintemp:', mintemp);
      console.log('maxtemp:', maxtemp);
      console.log('pop    :', pop);
    });
  })
  .catch(err => {
    // handle error
    console.log(err);
  })
