'use strict'

var superagent = require('superagent')
var fs = require('fs')

var twQuery = '[out:csv(::id)][timeout:25][date:"{{date}}"]; area(3600449220)->.searchArea; ( node["amenity"="drinking_water"](area.searchArea); way["amenity"="drinking_water"](area.searchArea); relation["amenity"="drinking_water"](area.searchArea);); out body; >; out skel qt;'

var output = []
var done = false

function formatDate(date) {
  var d = new Date(date)
  return (d.getYear() + 1900) + '-' + (d.getMonth() + 1) + '-' + (d.getDate())
}

function queryCount (date, output, done) {
  setTimeout(function () {
    console.log('getting data for ' + formatDate(date) + '...')
    superagent.post('http://overpass-api.de/api/interpreter')
      .type('form')
      .send({ data: twQuery.replace('{{date}}', formatDate(date)) })
      .end(function (err, res) {
        console.log('got data for ' + formatDate(date) + '...')
        output.push({ DATE: date, COUNT: res.text.split('\n').length - 1 })
        if (new Date(date) > Date.now()) {
          done(output)
        } else {
          queryCount(date + 86400000 * 7, output, done)
        }
      })
  }, 5000)
}

function outputCSV (data) {
  console.log('output to CSV...')
  fs.writeFileSync('count.csv',
    data.map(function (d) {
      return formatDate(d.DATE) + ',' + d.COUNT + '\n'
    })
    .join('')
  )
  done = true
}

queryCount((new Date('2015/1/1')).getTime(), output, outputCSV)

setInterval(function () {
  console.log('in progress...')
  if (done) process.exit(0)
}, 1000)
