import { css } from 'goober'

export default {
  title: css`
    margin: 1em 0 .5em 0;
    font-weight: bold;
    font-size: 1.5em;
  `,
  error: css`
    padding: 1em;
    color: white;
    font-weight: bold;
    background-color: var(--error-color);
    margin-bottom: 1em;
    border-radius: .5em;
  `,
  addr: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
  reference: css`
    display: flex;
    flex-direction: column;
    gap: .5em;
  `,
  discarded: css`
    color: var(--error-color);
  `,
  notExecutedYet: css`
    color: var(--warning-color);
  `
}