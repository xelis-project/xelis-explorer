// This code is for running the app with server side rendering
// Check out _worker.js to run with cloudflare pages or use node_server.js to run your own server

import { extractCss } from 'goober'

import App from '../app'
import { ServerRouter } from '../router'
import { renderApp, serverDataScript, getServerDataContext } from '../context/useServerData'

let css = extractCss()

export default async (serverContext, path) => {
  const helmetContext = {}
  const serverDataContext = getServerDataContext()

  const html = await renderApp({
    serverContext,
    serverDataContext,
    app: <App
      css={css}
      serverContext={serverContext}
      helmetContext={helmetContext}
      serverDataContext={serverDataContext}>
      <ServerRouter path={path} />
    </App>,
  })

  return template({ html, helmetContext, serverDataContext })
}

const template = ({ html, helmetContext, serverDataContext }) => {
  const { helmet } = helmetContext
  const { data } = serverDataContext
  return `
    <!DOCTYPE html>
    <html lang="en">

    <head ${helmet.htmlAttributes.toString()}>
      ${helmet.meta.toString()}
      ${helmet.title.toString()}
      ${helmet.link.toString()}
      ${helmet.style.toString()}
    </head>

    <body ${helmet.bodyAttributes.toString()}>
      <div id="app">${html}</div>
      ${serverDataScript(data)}
      <script src="/public/client.js"></script>
    </body>

    </html>
  `
}