import { glob } from 'goober'

import theme from './theme'

theme.dark`
  --scrollbar-width: 6px;
  --scrollbar-height: 6px;
  --scrollbar-track-bg: inherit;
  --scrollbar-thumb-bg: #727272;
  --scrollbar-thumb-border-radius: 15px;
  --scrollbar-thumb-bg-hover: white;
`

theme.light`
  --scrollbar-width: 6px;
  --scrollbar-height: 6px;
  --scrollbar-track-bg: inherit;
  --scrollbar-thumb-bg: #1c1c1c;
  --scrollbar-thumb-border-radius: 15px;
  --scrollbar-thumb-bg-hover: black;
`

theme.xelis`
  --scrollbar-width: 6px;
  --scrollbar-height: 6px;
  --scrollbar-track-bg: inherit;
  --scrollbar-thumb-bg: rgb(50 110 92 / 50%);
  --scrollbar-thumb-border-radius: 15px;
  --scrollbar-thumb-bg-hover: rgb(50 110 92);
`

glob`
  ::-webkit-scrollbar {
    width: var(--scrollbar-width);
    height: var(--scrollbar-height);
  }

  ::-webkit-scrollbar-track {
    background: var(--scrollbar-track-bg);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-bg);
    border-radius: var(--scrollbar-thumb-border-radius);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-bg-hover);
  }
`
