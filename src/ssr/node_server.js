import path from 'path'
import express from 'express'

import ssr from './ssr'

const app = express()

app.use(`/public`, express.static(path.join(__dirname, 'public')))

app.use(`*`, async (req, res) => {
  const url = new URL(req.baseUrl)
  const serverContext = { req, statusCode: 200 }
  const html = await ssr(serverContext, url.pathname || '/')

  res.writeHead(serverContext.statusCode, { 'Content-Type': 'text/html;charset=UTF-8' })
  res.end(html)
})

const hostname = '127.0.0.1'
const port = 3000

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
