import http from 'http'
import httpProxy from 'http-proxy'

export default function proxy (config, report) {
  const proxyServer = httpProxy.createProxyServer()
  const proxyConfig = {
    target: config.target
  }

  proxyServer.on('proxyRes', (proxyRes, req, res) => {
    report.hits.push({
      method: req.method,
      url: req.url,
      statusCode: proxyRes.statusCode
    })
  })

  return http.createServer((req, res) => {
    proxyServer.web(req, res, proxyConfig)
  }).listen(8000)
}
