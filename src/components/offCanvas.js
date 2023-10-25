import { useEffect, useState } from 'react'
import { css } from 'goober'

import theme from '../style/theme'

const defaultStyle = {
  offcanvas: css`
    position: fixed;
    top: 0;
    width: 100%;
    box-shadow: none;
    height: 100%;
    background-color: var(--bg-color);
    transition: all .3s ease-in-out;
    z-index: 9999;

    &[data-position="right"] {
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

    &[data-position="left"] {
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
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    }
  `
}

function OffCanvas(props) {
  const { children, position, maxWidth, opened, styling = defaultStyle, className } = props

  const [divStyle, setDivStyle] = useState({ maxWidth, transition: `none` }) // transition: none = don't animate on page load

  useEffect(() => {
    setDivStyle({ maxWidth })
  }, [opened])

  return <div data-open={opened} data-position={position} className={`${styling.offcanvas} ${className}`} style={divStyle}>
    {children}
  </div>
}

export default OffCanvas
