export default function print (config, report) {
  const routes = report.routes

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

  routes.forEach((route) => {
    console.log(`${route.method} ${route.path} (${route.statusCode}): ${route.hits}`)
  })
  console.log('Not Matched')
  report.notMatched.forEach((route) => {
    console.log(`${route.method} ${route.path} (${route.statusCode}): ${route.hits}`)
  })
}
