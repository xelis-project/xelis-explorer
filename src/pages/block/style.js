import { css } from 'goober'

import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'

export default {
  error: css`
    padding: 1em;
    color: white;
    font-weight: bold;
    background-color: var(--error-color);
    margin-bottom: 1em;
    border-radius: .5em;
  `,
  miner: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
  tips: css`
    display: flex;
    gap: .25em;
    flex-direction: column;
  `,
  header: {
    container: css`
      display: flex;
      flex-direction: column;
      margin-bottom: 2em;
      gap: 1em;

      ${theme.query.minDesktop} {
        flex-direction: row;
        align-items: start;
        justify-content: space-between;
      }
    `,
    buttons: css`
      display: flex;
      gap: 1em;

      a {
        border-radius: 30px;
        background-color: var(--text-color);
        color: var(--bg-color);
        padding: .5em 1em;
        display: flex;
        gap: .5em;
        align-items: center;
        white-space: nowrap;
        text-decoration: none;
        ${scaleOnHover}

        ${theme.query.maxDesktop} {
          > div {
            display: none;
          }
        }
      }
    `
  }
}
