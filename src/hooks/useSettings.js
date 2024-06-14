import { createContext, useCallback, useContext, useState } from 'react'
import store from 'store2'

const Context = createContext()

const storeSettings = store.namespace(`settings`)

export function SettingsProvider(props) {
  const { children, defaultSettings } = props

  const [settings, setSettings] = useState(() => {
    return storeSettings.getAll(Object.assign({}, defaultSettings)) // use object.assign or defaultSettings will get overwritten
  })

  const setValue = useCallback((key, value) => {
    const newSettings = Object.assign({}, settings)
    newSettings[key] = value
    setSettings(newSettings)
    storeSettings.setAll(newSettings)
  }, [settings])

  return <Context.Provider value={{ settings, setSettings, setValue }}>
    {children}
  </Context.Provider>
}

const useSettings = () => useContext(Context)
export default useSettings
