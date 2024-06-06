import { css } from 'goober'

import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'

export default {
  formItems: css`
    display: flex;
    gap: 2em;
    flex-direction: column;
    margin-top: 2em;
  `,
  formInput: css`
    background: linear-gradient(to right, #ffffff1c, transparent);
    padding: 1em;
    border-radius: .5em;
    display: flex;
    flex-direction: column;

    label {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 0.25em;
    }

    span {
      color: var(--muted-color);
      margin-bottom: 0.5em;
    }

    input {
      padding: .6em;
      border-radius: .5em;
      border: none;
      outline: none;
      font-size: 1em;
      background-color: ${theme.apply({ xelis: `var(--text-color)`, dark: `var(--text-color)`, light: `var(--bg-color)` })};
      color: ${theme.apply({ xelis: `var(--bg-color)`, dark: `var(--bg-color)`, light: `var(--text-color)` })};
      box-shadow: inset 3px 3px 5px 0px #a5a5a5;

      ${theme.query.minMobile} {
        max-width: 500px;
      }
    }
  `,
  formSave: css`
    display: flex;
    gap: 1em;
    margin-top: 1em;

    ${theme.query.minMobile} {
      max-width: 300px;
    }

    button {
      border: none;
      display: flex;
      gap: .5em;
      padding: .5em .7em;
      cursor: pointer;
      border-radius: 1em;
      width: 100%;
      font-weight: bold;
      font-size: 1em;
      align-items: center;
      ${scaleOnHover}
    }
  `
}
