import { useCallback } from 'react'
import Icon from '../components/icon'
import { useOverlay } from '../context/useOverlay'

const useOffCanvas = () => {
  const overlay = useOverlay()

  const createOffCanvas = useCallback(({ title, component, width }) => {
    return overlay.createOverlay((key) => {
      const closeOverlay = () => overlay.delOverlay(key, { timeout: 300 })

      return {
        opened: true,
        component: <div className="offcanvas" style={{ width }}>
          <div className="offcanvas-header">
            <div className="offcanvas-title">{title}</div>
            <button className="offcanvas-close" onClick={closeOverlay}>
              <Icon name="close" />
            </button>
          </div>
          {component}
        </div>,
        backdrop: <div className="offcanvas-backdrop" onClick={closeOverlay} />
      }
    }, [overlay])
  })

  return { createOffCanvas }
}

export default useOffCanvas
