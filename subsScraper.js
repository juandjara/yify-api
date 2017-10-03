const cheerio = require('cheerio')
const got = require('got')
const unzipper = require('unzipper').ParseOne
const srt2vtt = require('srt2vtt');
const streamz = require('streamz');

const uri = 'http://www.yifysubtitles.com/movie-imdb'
const scrape = imdbId => {
	return got(`${uri}/${imdbId}`)
  .then(res => cheerio.load(res.body))
  .then($ => {
    return $('tbody tr').map((i, el) => {
      const $el = $(el);
      return {
        rating: $el.find('.rating-cell').text(),
        language: $el.find('.flag-cell .sub-lang').text().toLowerCase(),
        url: $el.find('.download-cell a')
                .attr('href').replace('subtitles/', 'subtitle/') + '.zip'
      };
    }).get().map((sub, index) => ({...sub, index}))
  })
}
const convert = path => {
  const subUrl = (uri+path).replace('/movie-imdb', '')
  return new Promise((resolve, reject) => {
    let text = ""
    got.stream(subUrl, {encoding: null})
    .pipe(unzipper())
    .on('data', chunk => {
      text += chunk.toString('utf8')
    })
    .on('end', () => {      
      srt2vtt(text, (err, vtt) => {
        if(err) {
          reject(err)
          return
        }
        resolve(vtt)
      })
    })
    .on('error' , reject)
  })
}
const scrapeAndConvert = (imbd_id, index) => {
  return scrape(imbd_id)
  .then(movies => movies[index].url)
  .then(convert)
}

exports.scrapeAndConvert = scrapeAndConvert
exports.convert = convert
exports.scrape  = scrape