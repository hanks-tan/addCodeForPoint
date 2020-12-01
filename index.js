var readline = require('readline')
var path = require('path')
var fs = require('fs')
var turf = require('@turf/turf')
var regionData = require('./region.js')
var config = require('./config')

var cityList = regionData.features.map(item => {
  var ft = turf.polygon(item)
  return ft
})

function main(inputFile, outputFile) {
  var readStm = fs.createReadStream(inputFile)
  var writStm = fs.createWriteStream(outputFile)
  var enableWrite = true
  readStm.on('end', ()=> {
    enableWrite = false
  })

  var lineIndex = 0
  var xIndex = 0
  var yIndex = 0
  var len = 0

  var readlineObj = readline.createInterface({
    input: readStm,
    crlfDelay: Infinity
  })

  readlineObj.on('line', (line) => {
    if (line) {
      var values = line.split(config.separate)
      if(lineIndex > 0) {
        if(values.length !== len) {
          console.log(values)
        }
        var x = parseFloat(values[xIndex])
        var y = parseFloat(values[yIndex])
        var code = joinCode(x, y)
        code = code.toString()
        writStm.write(line + ',' + code + '\n')
      } else {
        xIndex = values.indexOf(config.x)
        yIndex = values.indexOf(config.y)
        len = values.length
        writStm.write(line + ',code\n')
      }
    }
    if (enableWrite) {
      lineIndex++
    }
  })
  
  readlineObj.on('close', ()=> {
    console.log('done...')
  })
}

function joinCode(x, y) {
  var point = turf.point([x, y])
  var code = ''
  cityList.forEach(city => {
    var coords = city.geometry.coordinates.geometry.coordinates
    var geo = turf.polygon(coords)
    var r = turf.booleanPointInPolygon(point, geo)
    if(r) {
      code = city.geometry.coordinates.properties.PAC
      return
    }
  })
  return code
}

var args = process.argv.splice(2)[0]
if (args) {
  console.log(args)
  var inPath = args
  if (!path.isAbsolute(args)) {
    inPath = path.join(__dirname, args)
  }
  var f = fs.statSync(inPath)
  if (f.isFile()) {
    var name = path.basename(inPath)
    var outPath = 'c_' + name
    outPath = path.join(path.dirname(inPath), outPath)
    main(inPath, outPath)
  }
}

// main('./testData/dm.csv', './testData/c_test.csv')