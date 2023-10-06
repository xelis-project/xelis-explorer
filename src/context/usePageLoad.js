import { useEffect, useRef, createContext, useContext, useState } from 'react'
import { useLocation } from 'react-router'

const Context = createContext({ firstPageLoad: true, firstRender: true })

export const usePageLoad = () => useContext(Context)

export const PageLoadProvider = (props) => {
  const { children } = props

  const firstRenderRef = useRef(true)
  const [firstPageLoad, setFirstPageLoad] = useState(true)
  const location = useLocation()
  const prevLocation = useRef(location)

  useEffect(() => {
    if (firstPageLoad && prevLocation.current !== location) {
      setFirstPageLoad(false)
    }

    if (firstRenderRef.current) {
      firstRenderRef.current = false
    }
  }, [location, firstPageLoad])

  const firstRender = firstRenderRef.current
  return <Context.Provider value={{ firstPageLoad, firstRender }}>
    {children}
  </Context.Provider>
}