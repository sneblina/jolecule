const fs = require('fs')
const R = require('ramda')

function wrapJson (wrapJsFname, jsonText) {
  let wrappedText = `define(function() {
    
return ${jsonText}

});`
  fs.writeFileSync(wrapJsFname, wrappedText)
}

function wrapJsonFname (jsonFname) {
  wrapJson(
    jsonFname.replace('.json', '.json.js'),
    fs.readFileSync(jsonFname).toString()
  )
}

let fnames = [
'P04637.4qo1.B.json', 'P04637.3q05.A.json', 'P04637.features.json']
for (let fname of fnames) {
  let data = require('./' + fname)
  wrapJson('./' + fname + '.js', JSON.stringify(data, null, 2))
}



