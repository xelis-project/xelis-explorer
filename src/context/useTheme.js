import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import store from 'store2'

const Context = createContext()

const themeStore = store.namespace(`theme`)

export const ThemeProvider = (props) => {
  const { children, defaultTheme } = props

  const [theme, _setTheme] = useState(() => {
    return themeStore.get(`current`, defaultTheme)
  })

  const setTheme = useCallback((value) => {
    themeStore.set(`current`, value)
    _setTheme(value)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <Context.Provider value={{ theme, setTheme }}>
    {children}
  </Context.Provider>
}

export const useTheme = () => useContext(Context)
export default useTheme

