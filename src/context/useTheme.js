import { createContext, useCallback, useContext, useLayoutEffect, useState } from 'react'
import useSettings, { settingsKeys } from './useSettings'

const Context = createContext()

export const ThemeProvider = (props) => {
  const { children } = props

  const { settings, setValue  } = useSettings()
  const theme = settings[settingsKeys.THEME]

  const setTheme = useCallback((value) => {
    setValue(settingsKeys.THEME, value)
  }, [])

  useLayoutEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  return <Context.Provider value={{ theme, setTheme }}>
    {children}
  </Context.Provider>
}

export const useTheme = () => useContext(Context)
export default useTheme

