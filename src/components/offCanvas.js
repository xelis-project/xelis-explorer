import { useCallback, useEffect, useState } from 'react'
import Icon from './icon'

function OffCanvas(props) {
  const { children, title, position, width, opened, onClose, className = `` } = props

  const openedClassname = opened ? `overlay-opened` : `overlay-closed`
  const close = useCallback(() => {
    if (typeof onClose === `function`) onClose()
  }, [])

  const [style, setStyle] = useState({ width, transition: `none` }) // transition: none = don't animate on page load

  useEffect(() => {
    setStyle({ width })
  }, [opened])

  return <div className={`offcanvas offcanvas-flex offcanvas-${position} ${openedClassname} ${className}`} style={style}>
    <div className="offcanvas-header">
      <div className="offcanvas-title">{title}</div>
      <button className="offcanvas-close" onClick={close}>
        <Icon name="close" />
      </button>
    </div>
    {children}
  </div>
}

export default OffCanvas
