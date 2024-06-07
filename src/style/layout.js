import { css } from 'goober'

import theme from './theme'
import { opacity } from './animate'

export default {
  container: css`
    position: relative;
    height: 100%;
  `,
  pageMaxWidth: css`
    margin: 0 auto;
    max-width: 1200px;
    width: 100%;
    padding: 0 1em;

    ${theme.query.minMobile} {
      padding: 0 2em;
    }

    ${theme.query.minLarge} {
      max-width: 1400px;
    }
  `,
  pageFlex: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    position: relative;
    z-index: 1;

    [data-opacity="true"] {
      ${opacity()};
    }
  `,
}