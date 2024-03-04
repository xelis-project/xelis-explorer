import { glob } from 'goober'

import theme from './theme'

theme.dark`
  --scrollbar-width: .45em;
  --scrollbar-height: .45em;
  --scrollbar-track-bg: rgb(0 0 0 / 30%);
  --scrollbar-thumb-bg: #727272;
  --scrollbar-thumb-border-radius: 15px;
  --scrollbar-thumb-bg-hover: white;
`

theme.light`
  --scrollbar-width: .45em;
  --scrollbar-height: .45em;
  --scrollbar-track-bg: rgb(0 0 0 / 10%);
  --scrollbar-thumb-bg: #636363;
  --scrollbar-thumb-border-radius: 15px;
  --scrollbar-thumb-bg-hover: black;
`

theme.xelis`
  --scrollbar-width: .45em;
  --scrollbar-height: .45em;
  --scrollbar-track-bg: rgb(0 0 0 / 50%);
  --scrollbar-thumb-bg: rgb(93 227 179);
  --scrollbar-thumb-border-radius: 15px;
  --scrollbar-thumb-bg-hover: rgb(86 185 150);
`

glob`
  ::-webkit-scrollbar {
    width: var(--scrollbar-width);
    height: var(--scrollbar-height);
  }

  ::-webkit-scrollbar-track {
    background: var(--scrollbar-track-bg);
    border-radius: var(--scrollbar-thumb-border-radius);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-bg);
    border-radius: var(--scrollbar-thumb-border-radius);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-bg-hover);
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
`
