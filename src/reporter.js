import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'
import querystring from 'querystring';
import url from 'url'

function getRoute (routes, hit) {
  return routes.find((route) => {
    if (route.method === hit.method && route.statusCode === hit.statusCode) {
      if (route.re && route.re.exec(hit.path) !== null) {
        let match = true
        console.log(hit.queryParams, route.params)
        _.forEach(hit.queryParams, (value, name) => {
          console.log(name, route.params)
          match &= route.params.has(name)
        })
        return match && Object.keys(hit.queryParams.length === route.params.length)
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
      const params = new Set();
      for (const parameter of methodDescription.parameters || []) {
        if (parameter.in === 'query') {
          params.add(parameter.name)
        }
      }
      _.forEach(methodDescription.responses, (x, statusCode) => {
        const normalizedPath = `${config.basePath}${normalizePath(path)}`
        routes.push({
          params,
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
    const hitUrl = url.parse(hit.url)
    hit.path = hitUrl.pathname
    if (hitUrl.query) {
      hit.queryParams = querystring.parse(hitUrl.query)
    } else {
      hit.queryParams = {}
    }
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
    if (route.hits > 0) {
      console.log(`${route.method} ${route.path} (${route.statusCode}): ${route.hits}`)
    }
  })
  console.log('Not Matched')
  report.notMatched.forEach((route) => {
    console.log(`${route.method} ${route.path} (${route.statusCode}): ${route.hits}`)
  })
  console.log('end report')
}
