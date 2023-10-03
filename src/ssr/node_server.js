import url from 'node:url'
import path from 'path'
import express from 'express'
import { html_beautify } from 'js-beautify'

import ssr from './ssr'

const app = express()

app.use(`/public`, express.static(path.join(__dirname, 'public')))

app.use(`*`, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' })

  const parsedUrl = url.parse(req.baseUrl)
  let statusCode = 200
  const html = ssr(req, statusCode, parsedUrl.pathname || '/')
  res.status(statusCode)
  res.end(html_beautify(html, { unformatted: [`style`] }))
})

const hostname = '127.0.0.1'
const port = 3000

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
