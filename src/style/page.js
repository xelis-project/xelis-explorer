import { css, glob } from 'goober'
import theme from './theme'

export const typography = css`
  h1 {
    margin: 1.5em 0 .5em 0;
    font-weight: bold;
    font-size: 2em;
  }

  h2 {
    margin: 1em 0 .5em 0;
    font-weight: bold;
    font-size: 1.5em;
  }
`

glob`
  * {
    box-sizing: border-box;
  }

  html, body {
    font-family: sans-serif;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--bg-color);
    color: var(--text-color);
    transition: all .25s;
    min-width: 320px;
    font-size: 16px;
    height: 100%;
  }

  #app {
    /* important 100% on html,body,#app */
    height: 100%;
  }

  button {
    user-select: none;
  }

  a {
    color: var(--link-color);
  }

  ${theme.query.minLarge} {
    html, body {
      font-size: 18px;
    }
  }
`