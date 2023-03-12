import React, { createContext, useCallback, useContext, useState, cloneElement, useEffect } from 'react'

const Context = createContext()

export const OverlayProvider = (props) => {
  const { children } = props

  const [overlays, setOverlays] = useState([])

  const createOverlay = useCallback((key, cb) => {
    if (!key) key = Date.now()

    const obj = cb(key)
    const { opened, component, backdrop } = obj

    setOverlays((overlays) => {
      if (overlays.find(item => item.key === key)) {
        return overlays.map((item) => {
          if (item.key === key) {
            item.component = component
            item.opened = opened
          }
          return item
        })
      } else {
        return [...overlays, { key, ...obj }]
      }
    })

    // important for css trigger open animation
    setTimeout(() => {
      toggleOverlay(key, opened)
    }, 0)

    return key
  }, [])

  const toggleOverlay = useCallback((key, value) => {
    setOverlays((overlays) => {
      return overlays.map((overlay) => {
        if (overlay.key === key) {
          overlay.opened = value
        }
        return overlay
      })
    })
  }, [])

  const delOverlay = useCallback((key, { timeout } = { timeout: 0 }) => {
    toggleOverlay(key, false)

    // for css closing timeout for animation if any
    setTimeout(() => {
      setOverlays((overlays) => {
        return overlays.filter((overlay) => overlay.key !== key)
      })
    }, timeout)
  }, [])

  return <Context.Provider value={{ createOverlay, toggleOverlay, delOverlay }}>
    {children}
    <div id="overlays">
      {overlays.map((overlay) => {
        const { opened, component, backdrop } = overlay

        const getProps = (c) => {
          const openedClassname = opened ? `overlay-opened` : `overlay-closed`
          return { className: `${c.props.className || ``} ${openedClassname}` }
        }

        return <div key={overlay.key}>
          {backdrop !== undefined && cloneElement(backdrop, getProps(backdrop))}
          {cloneElement(component, getProps(component))}
        </div>
      })}
    </div>
  </Context.Provider>
}

export const useOverlay = () => useContext(Context)
export default useOverlay
