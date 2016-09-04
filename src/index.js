import request from 'request-promise'
import {spawn} from 'child_process'
import yaml from 'js-yaml'
import fs from 'fs'

import proxy from './proxy'
import Report from './report'
import reporter from './reporter'

const config = yaml.safeLoad(fs.readFileSync('.swagcov.yml'))

request(`${config.target}${config.basePath}${config.swaggerPath}`)
  .then((swagger) => {
    const report = new Report(config, JSON.parse(swagger))
    const server = proxy(config, report)

    const child = spawn(process.argv[2], process.argv.slice(3), {
      stdio: [
        process.stdin, process.stdout, process.stderr, 'pipe'
      ]
    })

    child.on('close', (code) => {
      server.close(() => {
        reporter(config, report)
          .then(() => {
            process.exit(code)
          })
      })
    })
  })
