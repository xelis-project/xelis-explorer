import { css } from 'goober'

import { scaleOnHover } from '../../style/animate'

export default {
  container: css`
    margin: 5em auto;
    display: flex;
    flex-direction: column;
    max-width: 250px;
    align-items: center;
    text-align: center;
  `,
  title: css`
    font-size: 7em;
  `,
  subtitle: css`
    font-size: 1.7em;
    margin-top: .5em;
  `,
  description: css`
    margin: 1em 0 2em 0;
    color: var(--muted-color);
  `,
  goHome: css`
    border-radius: 1em;
    background-color: var(--text-color);
    color: var(--bg-color);
    padding: .6em 1em;
    display: flex;
    align-items: center;
    gap: .5em;
    border: none;
    cursor: pointer;
    text-decoration: none;
    ${scaleOnHover}
  `
}