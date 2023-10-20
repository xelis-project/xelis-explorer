import { useEffect, useState } from 'react'
import { css } from 'goober'

import theme from '../style/theme'

const style = {
  container: css`
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

      &[data-open="true"] {
        translate: 0;
        opacity: 1;
      }

      &[data-open="false"] {
        translate: 100%;
        opacity: 0;
      }
    }

    .offcanvas.left {
      translate: 0;
      left: 0;

      &[data-open="true"] {
        translate: 0;
        opacity: 1;
      }

      &[data-open="false"] {
        translate: -100%;
        opacity: 0;
      }
    }

    ${theme.query.minDesktop} {
      .offcanvas {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      }
    }
  `
}

function OffCanvas(props) {
  const { children, position, maxWidth, opened, className = `` } = props

  const [divStyle, setDivStyle] = useState({ maxWidth, transition: `none` }) // transition: none = don't animate on page load

  useEffect(() => {
    setDivStyle({ maxWidth })
  }, [opened])

  return <div className={style.container}>
    <div data-open={opened} className={`offcanvas ${position} ${className}`} style={divStyle}>
      {children}
    </div>
  </div>
}

export default OffCanvas
