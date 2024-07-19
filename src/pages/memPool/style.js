import { css } from 'goober'

import theme from '../../style/theme'

export default {
  searchInput: css`
    padding: 0.7em;
    border-radius: .5em;
    border: none;
    outline: none;
    font-size: 1.2em;
    background-color: ${theme.apply({ xelis: `rgb(0 0 0 / 20%)`, light: `rgb(255 255 255 / 20%)`, dark: `rgb(0 0 0 / 20%)` })};
    color: var(--text-color);
    width: 100%;
    border: 2px solid ${theme.apply({ xelis: `#7afad3`, light: `#cbcbcb`, dark: `#373737` })};

    &::placeholder {
      color: ${theme.apply({ xelis: `rgb(255 255 255 / 20%)`, light: `rgb(0 0 0 / 30%)`, dark: `rgb(255 255 255 / 20%)` })};
      opacity: 1;
    }
  `,
  title: css`
    margin: 1.5em 0 .7em 0;
    font-weight: bold;
    font-size: 1.2em;
  `,
  chart: css`
    margin-bottom: 2em;
    background-color: var(--content-bg-color);
    padding: 1.5em;
    border-radius: 1em;
    display: flex;
    gap: 1em;
    flex-direction: column;

    canvas {
      max-height: 10em;
    }
  `,
  tables: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    ${theme.query.minLarge} {
      flex-direction: row;
      gap: 1em;
    }

    > div {
      flex: 1;
      
      > div {
        max-height: 30em;
      }
    }
  `,
  addr: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
}