import { glob } from 'goober'
import hashIt from 'hash-it'

const query = {
  maxMobile: '@media only screen and (max-width: 424px)',
  minMobile: '@media only screen and (min-width: 424px)',
  maxDesktop: '@media only screen and (max-width: 768px)',
  minDesktop: '@media only screen and (min-width: 768px)'
}

// Keep goober 2.1.10 or glob will replace CSS instead of append
// https://github.com/cristianbote/goober/issues/496

const xelis = (style) => {
  glob`
    [data-theme="xelis"] {
      ${style}
    }
  `
}

const light = (style) => {
  glob`
    [data-theme="light"] {
      ${style}
    }
  `
}

const dark = (style) => {
  glob`
    [data-theme="dark"] {
      ${style}
    }
  `
}

const apply = (values) => {
  const keys = Object.keys(values)
  const name = hashIt(values)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = values[key]
    glob(`
      [data-theme="${key}"] {
        --${name}:${value};
      }
    `)
  }

  return `var(--${name})`
}

export default { query, light, dark, xelis, apply }

light`
  --bg-color: #fafafa;
  --text-color: #1c1c1c;
  --border-color: var(--text-color);
  --muted-color: rgba(0, 0, 0, .6);
  --error-color: red;
  --success-color: green;
  --link-color: #1870cb;
  --warning-color: #dfde32;
`

dark`
  --bg-color: #101010;
  --text-color: #f1f1f1;
  --border-color: var(--text-color);
  --muted-color: rgba(255, 255, 255, .6);
  --error-color: red;
  --success-color: green;
  --link-color: #1870cb;
  --warning-color: #dfde32;
`

xelis`
  --bg-color: #1d3b37;
  --text-color: #f1f1f1;
  --border-color: var(--text-color);
  --muted-color: rgb(255 255 255 / 50%);
  --error-color: red;
  --success-color: green;
  --link-color: #326e5c;
  --warning-color: #dfde32;
`
