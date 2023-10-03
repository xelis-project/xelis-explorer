// This code is for running the app with server side rendering
// Check out _worker.js to run with cloudflare pages or use node_server.js to run your own server

import ReactDOMServer from 'react-dom/server'
import { extractCss } from 'goober'

import App, { helmetContext } from '../app'
import { ServerRouter } from '../router'

let css = null

export default (req, statusCode, path) => {
  const app = ReactDOMServer.renderToString(<App serverContext={{ req, statusCode }}>
    <ServerRouter path={path} />
  </App>)
  if (!css) css = extractCss()

  const { helmet } = helmetContext

  return `
      <!DOCTYPE html>
      <html lang="en">

      <head ${helmet.htmlAttributes.toString()}>
        ${helmet.meta.toString()}
        ${helmet.title.toString()}
        ${helmet.link.toString()}
        ${helmet.style.toString()}
        <style id="_goober">${css}</style>
      </head>

      <body ${helmet.bodyAttributes.toString()}>
        <div id="app">${app}</div>
        <script src="/public/client.js"></script>
      </body>

      </html>
    `
}