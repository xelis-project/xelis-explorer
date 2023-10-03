import { createContext, useContext } from 'react'

const Context = createContext(null) // { req, statusCode }

export default () => useContext(Context)

export const ServerProvider = (props) => {
  const { context, children } = props

  return <Context.Provider value={context}>
    {children}
  </Context.Provider>
}
