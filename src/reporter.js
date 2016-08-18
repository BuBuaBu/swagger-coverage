import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'


function getRoute (routes, hit) {
  return routes.find((route) => {
    if (route.method === hit.method && route.statusCode === hit.statusCode) {
      if (route.re) {
        return route.re.exec(hit.url) !== null
      }
      return route.path === hit.url
    }
  })
}

function normalizePath (path) {
  const matches = path.match(/\{(.*?)\}/g)

  if (matches) {
    _.forEach(matches, (match) => {
      path = path.replace(match, `:${match.replace(/[{}]/g, '')}`)
    })
  }

  return path
}

export default function reporter (config, report) {
  console.log('start report')
  const routes = []
  _.forEach(config.swagger.paths, (methods, path) => {
    _.forEach(methods, (methodDescription, method) => {
      _.forEach(methodDescription.responses, (x, statusCode) => {
        const normalizedPath = `${config.basePath}${normalizePath(path)}`
        routes.push({
          statusCode: Number.parseInt(statusCode, 10),
          path: normalizedPath,
          re: pathToRegexp(normalizedPath, []),
          method: method.toUpperCase(),
          hits: 0
        })
      })
    })
  })

  routes.sort((a, b) => {
    if (a.path === b.path) {
      if (a.method === b.method) {
        if (a.statusCode === b.statusCode) {
          return 0
        } else if (a.statusCode > b.statusCode) {
          return 1
        } else {
          return -1
        }
      } else if (a.method > b.method) {
        return 1
      } else {
        return -1
      }
    } else if (a.path > b.path) {
      return 1
    } else {
      return -1
    }
  })

  report.hits.forEach((hit) => {
    let route = getRoute(routes, hit)
    if (route) {
      route.hits += 1
    } else {
      route = getRoute(report.notMatched, hit)
      if (route) {
        route.hits += 1
      } else {
        report.notMatched.push({
          statusCode: hit.statusCode,
          path: hit.url,
          method: hit.method,
          hits: 1
        })
      }
    }
  })

  routes.forEach((route) => {
    console.log(`${route.method} ${route.path} (${route.statusCode}): ${route.hits}`)
  })
  console.log('Not Matched')
  report.notMatched.forEach((route) => {
    console.log(`${route.method} ${route.path} (${route.statusCode}): ${route.hits}`)
  })
  console.log('end report')
}
