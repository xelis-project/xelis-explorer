import { html_beautify } from 'js-beautify'

import ssr from './ssr'

export default {
  async fetch(req, env) {
    const url = new URL(req.url)

    if (url.pathname.startsWith('/public')) {
      return env.ASSETS.fetch(req)
    }

    const serverContext = { req, statusCode: 200 }
    const html = await ssr(serverContext, url.pathname || '/')

    const init = {
      status: serverContext.statusCode,
      headers: {
        "content-type": "text/html;charset=UTF-8"
      }
    }

    return new Response(html_beautify(html, { unformatted: [`style`, `script`] }), init)
  }
}