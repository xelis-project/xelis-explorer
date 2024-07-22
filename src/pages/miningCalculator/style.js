import { css } from 'goober'

import theme from '../../style/theme'

export default {
  box: {
    container: css`
      background: var(--content-bg-color);
      padding: 1.5em;
      border-top-right-radius: 1em;
      border-top-left-radius: 1em;
    `,
    networkHashrate: {
      container: css`
        font-size: 1.2em;
        border-radius: 1em;
        margin-bottom: 1em;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        display: flex;
        justify-content: space-between;
      `,
      value: css`
        display: flex;
        font-size: .9em;
        align-items: center;
        border-radius: .5em;
        border: 2px solid var(--content-bg-color);

        > :nth-child(1) {
          padding: .5em .75em;
          color: var(--muted-color);
        }

        > :nth-child(2) {
          padding: .5em .75em;
          background: var(--content-bg-color);
        }
      `
    },
    inputCalculator: css`
      position: relative;
      display: flex;
      align-items: center;

      input {
        width: 100%;
        padding: 1em 1.5em;
        font-size: 1.1em;
        border-radius: 30px;
        outline: none;
        color: var(--text-color);
        background-color: var(--content-bg-color);
        border: none;
        font-weight: bold;
      }

      select {
        position: absolute;
        right: 2em;
        font-size: 1.1em;
        border: none;
        background: transparent;
        color: var(--text-color);
        cursor: pointer;
        outline: none;

        option {
          background: var(--bg-color);
        }
      }
    `,
  },
  miningReward: {
    container: css`
      background: ${theme.apply({ xelis: `#000000c9`, dark: `#000000c9`, light: `#ffffff7a` })};
      padding: 1em;
      border-bottom-right-radius: 1em;
      border-bottom-left-radius: 1em;
    `,
    timeBlock: css`
      text-decoration: underline;
    `,
    result: css`
      font-size: 1.3em;
      margin-bottom: .5em;
    `,
    specify: css`
      margin-bottom: 1em;
      color: var(--muted-color);
    `,
    timeReward: css`
      list-style-type: disc;
      padding-left: 1em;
      padding-top: .5em;
      line-height: 1.3em;
      margin-bottom: 1em;
    `,
    explanation: css`
      color: var(--muted-color);
    `
  }
}
