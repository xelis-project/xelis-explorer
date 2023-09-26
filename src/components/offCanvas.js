import { useCallback, useEffect, useState } from 'react'
import { css } from 'goober'

import Icon from './icon'
import theme from '../theme'

const style = {
  container: css`
    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      z-index: 1;
      opacity: 0;
      transition: opacity .3s ease-in-out;
    }

    .backdrop.opened {
      opacity: 1;
    }

    .backdrop.closed {
      opacity: 0;
    }

    .offcanvas {
      position: fixed;
      top: 0;
      width: 100%;
      box-shadow: none;
      height: 100%;
      background-color: var(--bg-color);
      transition: all .3s ease-in-out;
      z-index: 9999;
    }

    .offcanvas.right {
      translate: 100%;
      right: 0;
    }

    .offcanvas.left {
      translate: 0;
      left: 0;
    }

    .offcanvas.right.opened {
      translate: 0;
      opacity: 1;
    }

    .offcanvas.right.closed {
      translate: 100%;
      opacity: 0;
    }

    .offcanvas.left.opened {
      translate: 0;
      opacity: 1;
    }

    .offcanvas.left.closed {
      translate: -100%;
      opacity: 0;
    }

    ${theme.query.desktop} {
      .offcanvas {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      }
    }
  `
}

function OffCanvas(props) {
  const { children, position, maxWidth, opened, className = `` } = props

  const openedClassname = opened ? `opened` : `closed`
  const [divStyle, setDivStyle] = useState({ maxWidth, transition: `none` }) // transition: none = don't animate on page load

  useEffect(() => {
    setDivStyle({ maxWidth })
  }, [opened])

  return <div className={style.container}>
    <div className={`offcanvas ${position} ${openedClassname} ${className}`} style={divStyle}>
      {children}
    </div>
  </div>
}

export default OffCanvas
