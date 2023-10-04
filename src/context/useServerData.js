import React, { createContext } from 'react'
import { renderToString } from 'react-dom/server'

const Context = createContext({ funcs: {}, data: {} })

export const useServerData = (key, func, initialData) => {
  const context = React.useContext(Context)
  if (!context.funcs[key]) context.funcs[key] = func
  return context.data[key] || initialData
}

const WINDOW_DATA_KEY = `serverData`

export let getServerDataContext = () => {
  let data = {}
  if (typeof window === `object` && window[WINDOW_DATA_KEY]) {
    data = window[WINDOW_DATA_KEY]
    //Reflect.deleteProperty(window, WINDOW_DATA_KEY)
  }

  return { data, funcs: {} }
} 

export const serverDataScript = (data) => {
  return `<script>window.${WINDOW_DATA_KEY} = ${JSON.stringify(data)};</script>`
}

export const ServerDataProvider = (props) => {
  const { children, context } = props
  return <Context.Provider value={context}>
    {children}
  </Context.Provider>
}

export const renderApp = async ({ serverDataContext, serverContext, app }) => {
  await Promise.all(Object.keys(serverDataContext.funcs).map(async (key) => {
    const func = serverDataContext.funcs[key]
    serverDataContext.data[key] = await func(serverContext)
  }))

  const preCount = Object.keys(serverDataContext.funcs).length
  const html = renderToString(app)
  const postCount = Object.keys(serverDataContext.funcs).length
  if (postCount > preCount) {
    // looks like we have server funcs to await, let's re-render
    return renderApp({ serverDataContext, serverContext, app })
  }

  return html
}
