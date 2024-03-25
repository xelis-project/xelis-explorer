import { css } from 'goober'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const animationDuration = 300

const style = {
  container: css`
    position: fixed;
    z-index: 3;

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;

      transition: all ${animationDuration}ms;
    }

    .backdrop.hide {
      transition-timing-function: ease-in;
      background-color: rgb(0 0 0 / 0%);
      backdrop-filter: blur(0px);
    }

    .backdrop.show {
      transition-timing-function: ease-out;
      backdrop-filter: blur(5px);
      background-color: rgb(0 0 0 / 40%);
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all ${animationDuration}ms;
      margin: 1em;
    }

    .modal.hide {
      transition-timing-function: ease-in;
      opacity: 0;
    }

    .modal.show {
      transition-timing-function: ease-out;
      opacity: 1;
    }
  `
}

function Modal(props) {
  const { children, visible = false, setVisible, ...restProps } = props

  const modalRef = useRef()
  const [display, setDisplay] = useState(visible)
  const [animateClass, setAnimateClass] = useState(``)

  const clickOutside = useCallback((e) => {
    if (e.target.contains(modalRef.current)) {
      setVisible(false)
    }
  }, [])

  useEffect(() => {
    if (display === visible) return

    if (visible) {
      setDisplay(true)
      setTimeout(() => setAnimateClass(`show`), 10)
    } else {
      setAnimateClass(`hide`)
      setTimeout(() => {
        setDisplay(false)
      }, animationDuration)
    }
  }, [display, visible])

  if (!display) return null

  return createPortal(<div className={style.container} onClick={clickOutside}>
    <div className={`backdrop ${animateClass}`} />
    <div ref={modalRef} className={`modal ${animateClass}`}>
      {children}
    </div>
  </div>, document.body)
}

export default Modal