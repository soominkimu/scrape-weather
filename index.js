// 全国主要地点の週間天気予報
// Wep scraping by node.js
// Soomin K., Dec.20, 2018

// Usage:
// $ node index.js > report.json

/* Current structure for the weekly weather report that covers all 22 areas in Japan
 * ---------------------------------------------------------------------------------- *
<table class="forecastlist" id="infotablefont">
  <caption style="text-align:left;">12月20日11時　全国主要地点の週間天気予報</caption>
  <tbody>
    <tr>
      <th class="weekday">日付</th>
      <th class="weekday">"21"<br>"金"</th>
      ...
    </tr>
    <tr>
      <td rowspan="2" class="area">"釧路"<br>...</td>
      <td class="forecast">
        <img src="img/100.png" align="middle" width="60" title="晴れ" alt="晴れ"><br>
        <font class="mintemp">-10</font>"&nbsp;/"
        <font class="maxtemp">2</font><br>
        <font class="pop">0/0/0/0</font><br>
      </td>
      <td class="forecast">
        ...
    </tr>
    <tr>
      <td class="topbottom">／</td>
      <td class="topbottom">／</td>
      <td class="topbottom-bgc">Ｃ</td>
      <td class="topbottom-bgc">Ｃ</td>
      <td class="topbottom">Ａ</td>
      <td class="topbottom-bgb">Ｂ</td>
      <td class="topbottom-bgb">Ｂ</td>
    </tr>
    ...
  </tbody>
</table>
 * ---------------------------------------------------------------------------------- *
 * 降水確率：00-06/06-12/12-18/18-24
*/
// DEPENDENCIES:
// - request: Simplified HTTP client
// - request-promise: The simplified HTTP request client 'request' with Promise support.
//   Powered by Bluebird.
// - cheerio: Fast, flexible & lean implementation of core jQuery designed specifically for the server.
//   Wraps around htmlparser2 (a forgiving HTML/XML/RSS parser)
// * For dynamics websites (server-side rendering), need to use Google's puppeteer (headless Chrome)

const reqprom = require('request-promise');
const cheerio = require('cheerio');
const urlJMA  = 'https://www.jma.go.jp/jp/week/';

const JSONfy = (name, arr, end=',') =>
  console.log(`"${name}":` + JSON.stringify(arr).replace('null', '') + end);

// 信頼度（ＡＢＣ）　3日目以降の降水の有無の予報について「予報が適中しやすい」ことと
// 「予報が変わりにくい」ことを表す情報で、予報の確度が高い順にＡ、Ｂ、Ｃの3段階で表します。
const getReliabilityLevel = (tb) => { // from tobbotom.. attributes
  switch (tb) {
    case '／': return 0;
    case 'Ａ': return 1;
    case 'Ｂ': return 2;
    case 'Ｃ': return 3;
    default  : return -1;  // error
  }
}

const getStatus = (fn) =>  // from image filename
  parseInt(fn.replace(/^.*[\\\/]/, '').split('.')[0]);  // RegExp to get only the filename

reqprom(urlJMA)
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
    console.log('{"date-report":' + JSON.stringify(caption.split('　')[0]) + ',');

    const fTbody = fT.find('tbody');

    // get only the first row of the date columns
    const dateCol = [];
    fTbody.find('tr').first().children('th').each((i, el) => {
        dateCol.push($(el).text());
      }
    );
    console.log('"date-col":' + JSON.stringify(dateCol) + ',');
    console.log('"forecast":[');
    const fArea  = fTbody.find('td[class=area]');
    const i_last = fArea.length - 1;
    let area = [];
    fArea.each((i, elem) => {
      area.push($(elem).text().trim());  // trim to remove the trailing newline
      let status  = [];
      let title   = [];
      let mintemp = [];
      let maxtemp = [];
      let pop     = [];
      let relilev = [];
      $(elem).siblings('td[class=forecast]').each((j, el) => {
        const em =            $(el).children('img');
        status.push(getStatus($(em).attr('src')));                 // from image filename take status #
        title.push           ($(em).attr('title'));                // status is in title or alt attrib.
        mintemp.push(parseInt($(el).children('.mintemp').text())); // low  temp (can be null)
        maxtemp.push(parseInt($(el).children('.maxtemp').text())); // high temp (can be null)
        pop.push             ($(el).children('.pop').text());      // rain possibility (can contain '-')
      });
      $(elem).parent().next().children('td[class^=topbottom]').each((k, el) => {
        relilev.push(getReliabilityLevel($(el).text()));
      });
      console.log('{"area":"' + area[i] + '",');
      JSONfy("status",  status);
      JSONfy("title",   title);
      JSONfy("mintemp", mintemp);
      JSONfy("maxtemp", maxtemp);
      JSONfy("pop",     pop);
      JSONfy("relilev", relilev, '}' + (i < i_last ? ',' : ''));
    });
    console.log(']}');
  })
  .catch(err => {
    // handle error
    console.log('🚨', urlJMA, err);
  })
