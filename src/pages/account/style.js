import { css } from 'goober'
import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'

export default {
  addrModal: {
    container: css`
      background-color: var(--table-td-bg-color);
      border-radius: .5em;
      padding: 1em;
    `,
    title: css`
      font-size: 1.6em;
      margin-bottom: .25em;
      text-align: center;
    `,
    addr: css`
      display: flex;
      gap: .5em;
      color: var(--muted-color);
      font-size: 1.2em;
      margin-bottom: 1em;
      align-items: center;
      justify-content: center;
    `,
    copy: css`
      cursor: pointer;
    `
  },
  amountModal: {
    container: css`
      background-color: var(--table-td-bg-color);
      border-radius: .5em;
      padding: 1em;
    `,
    title: css`
      font-size: 1.6em;
      margin-bottom: .25em;
      text-align: center;
    `,
    value: css`
      word-break: break-all;
      color: var(--muted-color);
    `,
    button: css`
      border: thin solid var(--muted-color);
      background: transparent;
      padding: .5em;
      border-radius: .5em;
      cursor: pointer;
      color: var(--muted-color);
      display: flex;
      gap: .5em;
      align-items: center;
      transition: all .25s;
      
      &:hover {
        border: thin solid var(--text-color);
        color: var(--text-color);
      }
    `,
  },
  account: {
    container: css`
      display: flex;
      gap: 1em;
      flex-direction: column;

      ${theme.query.minDesktop} {
        flex-direction: row;
      }
    `,
    left: css`
      flex: 1;
      min-width: 250px;
    `,
    leftBg: css`
      display: flex;
      gap: 1em;
      flex-direction: column;
      background-color: var(--table-td-bg-color);
      padding: 1em;
      border-top: .3em solid var(--table-th-bg-color);
      border-radius: .5em;
    `,
    right: css`
      flex: 3;
    `,
    fromTo: css`
      display: flex;
      gap: .5em;
      align-items: center;
    `,
    item: {
      container: css`
        display: flex;
        gap: .5em;
        flex-direction: column;
      `,
      title: css`
        color: var(--muted-color);
        font-size: 1em;
      `,
      value: css`
        font-size: 1.4em;
      `,
      subvalue: css`
        font-size: .8em;
        margin-top: 0.25em;
      `
    }
  },
  accountDetails: {
    container: css`
      display: flex;
      gap: 1em;
      flex-direction: column;
      position: relative;
    `,
    hashicon: css`
      padding: 1em;
      border-radius: 50%;
      background-color: #333333;
      display: flex;
      justify-content: center;
      margin: 0 auto;
    `,
    addr: css`
      max-width: 300px;
      margin: 0 auto;
      word-break: break-all;
      text-align: center;
      font-size: 1.3em;
    `,
    qrCode: css`
      position: absolute;
      right: 0;
      
      button {
        border-radius: 50%;
        border: thin solid var(--text-color);
        transition: .1s transform;
        background: none;
        color: var(--text-color);
        cursor: pointer;
        font-size: .8em;
        width: 2.5em;
        height: 2.5em;
        ${scaleOnHover()};
      }
    `
  },
  pagination: css`
    margin-top: .5em;
    display: flex;
    gap: .5em;

    button {
      display: flex;
      gap: .5em;
      align-items: center;
      border-radius: 25px;
      border: thin solid var(--text-color);
      transition: .1s all;
      background: none;
      color: var(--text-color);
      cursor: pointer;
      padding: 0.5em 1em;
      font-weight: bold;
      ${scaleOnHover()};
    }
  `
}
