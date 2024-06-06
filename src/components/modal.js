import { css } from 'goober'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const animationDuration = 400

const defaultStyle = {
  container: css`
    position: fixed;
    z-index: 3;
  `,
  backdrop: css`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    transition: all ${animationDuration}ms;
    transition-timing-function: ease-in;
    background-color: rgb(0 0 0 / 0%);
    backdrop-filter: blur(0px);
  `,
  backdropShow: css`
    transition-timing-function: ease-out;
    backdrop-filter: blur(5px);
    background-color: rgb(0 0 0 / 40%);
  `,
  modal: css`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2em;

    transition: all ${animationDuration}ms;
    transition-timing-function: ease-in;
    opacity: 0;
  `,
  modalShow: css`
    transition-timing-function: ease-out;
    opacity: 1;
  `
}

function Modal(props) {
  const { children, visible = false, setVisible, styling = defaultStyle } = props

  const modalRef = useRef()
  const [display, setDisplay] = useState(visible)
  const [animate, setAnimate] = useState(false)

  const clickOutside = useCallback((e) => {
    if (e.target.contains(modalRef.current)) {
      setVisible(false)
    }
  }, [])

  useEffect(() => {
    if (display === visible) return

    if (visible) {
      setDisplay(true)
      setTimeout(() => setAnimate(true), 10)
    } else {
      setAnimate(false)
      setTimeout(() => {
        setDisplay(false)
      }, animationDuration)
    }
  }, [display, visible])

  if (!display) return null

  return createPortal(<div className={styling.container} onClick={clickOutside}>
    <div className={`${styling.backdrop} ${animate && styling.backdropShow}`} />
    <div ref={modalRef} className={`${styling.modal} ${animate && styling.modalShow}`}>
      {children}
    </div>
  </div>, document.body)
}

export default Modal