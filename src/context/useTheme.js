import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react'
import store from 'store2'

const Context = createContext()

const storeTheme = store.namespace(`theme`)

export const ThemeProvider = (props) => {
  const { children, defaultTheme = `dark` } = props

  const [theme, _setTheme] = useState(() => {
    return storeTheme.get(`current`, defaultTheme)
  })

  const setTheme = useCallback((value) => {
    storeTheme.set(`current`, value)
    _setTheme(value)
  }, [])

  const toggleTheme = useCallback(() => {
    if (theme === `dark`) _setTheme(`light`)
    else _setTheme(`dark`)
  }, [theme])

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-style', `classic`)
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  return <Context.Provider value={{ theme, setTheme, toggleTheme }}>
    {children}
  </Context.Provider>
}

export const useTheme = () => useContext(Context)
export default useTheme

