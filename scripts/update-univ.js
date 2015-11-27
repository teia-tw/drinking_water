'use strict'

var superagent = require('superagent')
var fs = require('fs')

var query = '[out:json];area({{osmID}})->.searchArea;node["amenity"="drinking_water"](area.searchArea);out count;'

fs.readFile('university.csv', function (err, data) {
  (function queryCount (data, output, done) {
    console.log(data.length + ' rows remain...')
    if (data.length == 0) {
      return done(output)
    }
    var row = data.shift()
    if (! row.split(',')[1]) {
      console.log('no osm id, skip.')
      return queryCount(data, output, done)
    }
    setTimeout(function () {
      console.log('getting count...')
      superagent.post('http://overpass-api.de/api/interpreter')
        .type('form')
        .send({
          data: query.replace('{{osmID}}', row.split(',')[1])
        })
      .end(function (err, res) {
        console.log('got count of ' + row.split(',')[0] + '...')
        if (err) {
          return console.log(err)
        }
        queryCount(data, output.concat({
          name: row.split(',')[0],
          count: (res.body.elements[0] ? res.body.elements[0].count.total : 0)
        }), done)
      })
    }, 1000)
  })(data.toString().split('\n').slice(1), [], function (data) {
    fs.writeFile('univ.csv', data.map((row) => row.name + ',' + row.count).join('\n'), () => console.log('done!'))
  })
})
