import { createContext, useContext, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

import useCookie from './useCookie'

const Context = createContext()

const validateTheme = (theme) => {
  if ([`xelis`, `dark`, `light`].indexOf(theme) !== -1) {
    return theme
  }

  return `xelis`
}

export const ThemeProvider = (props) => {
  const { children } = props

  const [cookieTheme, setTheme] = useCookie('theme')

  let theme = validateTheme(cookieTheme)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  return <Context.Provider value={{ theme, setTheme }}>
    <Helmet bodyAttributes={{ 'data-theme': theme }} />
    {children}
  </Context.Provider>
}

export const useTheme = () => useContext(Context)
export default useTheme

