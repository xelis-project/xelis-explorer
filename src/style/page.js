import { glob } from 'goober'

import theme from './theme'

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
    min-width: 320px;
    font-size: 16px;
    height: 100%;
  }

  #app {
    /* important 100% on html,body,#app */
    /*height: 100%;*/
  }

  button {
    user-select: none;
  }

  a {
    color: var(--link-color);

    &:hover {
      color: var(--link-hover-color);
    }
  }

  ${theme.query.minLarge} {
    html, body {
      font-size: 18px;
    }
  }
`