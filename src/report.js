import _ from 'lodash'
import pathToRegexp from 'path-to-regexp'
import querystring from 'querystring'
import Url from 'url'

export default class Report {
  constructor (config, swagger) {
    this.routes = []
    this.notMatched = new Map()
    _.forEach(swagger.paths, (methods, path) => {
      _.forEach(methods, (methodDescription, method) => {
        const params = new Set();
        for (const parameter of methodDescription.parameters || []) {
          if (parameter.in === 'query') {
            params.add(parameter.name)
          }
        }
        _.forEach(methodDescription.responses, (x, statusCode) => {
          this.addRoute(new Route(config.basePath, path, method, statusCode, x.description, params))
        })
      })
    })
  }

  hit (method, url, statusCode) {
    const hitUrl = Url.parse(url)
    const path = hitUrl.pathname
    const queryParams = hitUrl.query ? querystring.parse(hitUrl.query) : {}
    const route = this.routes.find((e) => {
      if (e.method === method && e.statusCode === statusCode) {
        if (e.re && e.re.exec(path) !== null) {
          let match = true
          _.forEach(queryParams, (value, name) => {
            match &= e.params.has(name)
          })
          return match && Object.keys(queryParams.length === e.params.length)
        }
        return e.path === url
      }
    })
    if (route) {
      route.hits += 1
    } else {
      const key = `${method}¤${url}¤${statusCode}`
      const unmatchedRoute = this.notMatched.get(key)
      if (unmatchedRoute) {
        unmatchedRoute.hits += 1
      } else {
        this.notMatched.set(key, {
          method, url, statusCode, hits: 1
        })
      }
    }
  }

  get byPath () {
    const paths = {
      values: new Map(),
      total: 0,
      hits: 0,
      success: 0,
      danger: 100
    }
    for (const route of this.routes) {
      let methods = paths.values.get(route.path)
      if (!methods) {
        methods = {
          values: new Map(),
          total: 0,
          hits: 0,
          success: 0,
          danger: 100
        }
        paths.values.set(route.path, methods)
      }
      let statusCodes = methods.values.get(route.method)
      if (!statusCodes) {
        statusCodes = []
        methods.values.set(route.method, statusCodes)
      }
      if (route.hits > 0) {
        methods.hits += 1
      }
      methods.total += 1
      methods.success = Math.round(( methods.hits / methods.total ) * 100)
      methods.danger = 100 - methods.success

      if (route.hits > 0) {
        paths.hits += 1
      }
      paths.total += 1
      paths.success = Math.round(( paths.hits / paths.total ) * 100)
      paths.danger = 100 - paths.success
      statusCodes.push(route)
    }
    return paths
  }

  addRoute (route) {
    this.routes.push(route)
  }
}

class Route {
  constructor (basePath, path, method, statusCode, description, params) {
    this.path = path
    this.normalizedPath = `${basePath}${normalizePath(path)}`
    this.re = pathToRegexp(this.normalizedPath, [])
    this.method = method.toUpperCase()
    this.statusCode = Number.parseInt(statusCode, 10)
    this.description = description
    this.params = params
    this.hits = 0
  }
}

function normalizePath (path) {
  const parameters = path.match(/\{(.*?)\}/g)

  if (parameters) {
    _.forEach(parameters, (parameter) => {
      path = path.replace(parameter, `:${parameter.replace(/[{}]/g, '')}`)
    })
  }

  return path
}
