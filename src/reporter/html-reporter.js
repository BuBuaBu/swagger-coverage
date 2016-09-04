import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import shortid from 'shortid'
import inliner from 'html-inline'
import streamBuffer from 'stream-buffers'
const yaml = require('js-yaml')

Handlebars.registerHelper('eachInMap', (map, options) => {
  const out = [];
  map.forEach((value, key) => {
    out.push({key, value, id: shortid.generate()});
  })
  out.sort((a, b) => {
    return +(a.key > b.key) || +(a.key === b.key) - 1
  })
  let res = ''
  out.forEach((a) => {
    res += options.fn(a)
  })
  return res;
})

const template = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'report.mustache')).toString())

export default function write (config, report) {
  return new Promise((resolve) => {
    const output = config.output || 'swagcov-report.html'
    const reportFile = fs.createWriteStream(output);
    const tr = inliner({basedir: __dirname})
    tr.pipe(reportFile)

    const sb = new streamBuffer.ReadableStreamBuffer()
    sb.put(template(report.byPath))
    sb.stop()
    sb.pipe(tr)

    reportFile.on('end', () => {
      console.log('Report saved to', output)
      resolve()
    })
  })
}
