import { html_beautify } from 'js-beautify'

import ssr from './ssr'

export default {
  async fetch(req, statusCode, env) {
    const url = new URL(req.url)

    if (url.pathname.startsWith('/public')) {
      return env.ASSETS.fetch(req)
    }

    const html = ssr(req, url.pathname || '/')

    const init = {
      status: statusCode,
      headers: {
        "content-type": "text/html;charset=UTF-8"
      }
    }

    return new Response(html_beautify(html, { unformatted: [`style`] }), init)
  }
}