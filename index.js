import request from 'request-promise'

import proxy from './src/proxy'
import reporter from './src/reporter'

const config = {
  target: 'http://localhost:10010',
  basePath: '/api/v1',
  swaggerPath: '/api-docs'
}

const report = {
  hits: [],
  notMatched: []
}

request(`${config.target}${config.basePath}${config.swaggerPath}`)
  .then((swagger) => {
    config.swagger = JSON.parse(swagger)
    const server = proxy(config, report)

    process.on('SIGINT', () => {
      server.close(() => {
        reporter(config, report)
        process.exit()
      })
    })
  })
