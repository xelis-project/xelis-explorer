import { css } from 'goober'
import theme from '../../style/theme'

export default {
  addrModal: {
    container: css`
      background-color: var(--table-td-bg-color);
      border-radius: 1em;
      padding: 2em;
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
      border-radius: 1em;
      padding: 2em;
      max-width: 20em;
      display: flex;
      flex-direction: column;
      gap: .5em;
      align-items: center;
      text-align: center;

      svg {
        max-width: 8em;
      }
    `,
    title: css`
      font-size: 1.6em;
      margin-bottom: .25em;
    `,
    hexCommitment: css`
      word-break: break-all;
      color: var(--muted-color);
    `,
    button: css`
      border: 2px solid var(--muted-color);
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
        border: 2px solid var(--text-color);
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
      overflow: auto;
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
        font-size: 1.1em;
      `,
      subvalue: css`
        font-size: .8em;
        margin-top: 0.25em;
      `
    },
    topInfo: css`
      border-radius: .75em;
      padding: 1em;
      background: var(--content-bg-color);
      margin-bottom: 1em;
      line-height: 1.2em;
      display: flex;
      gap: 1em;
      align-items: center;

      i {
        font-size: 2em;
      }
    `,
    topSubInfo: css`
      color: var(--muted-color);
      margin-top: .25em;
    `,
    infoBreak: css`
      word-break: break-all;
    `
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
        border: 2px solid var(--text-color);
        transition: .1s transform;
        background: none;
        color: var(--text-color);
        cursor: pointer;
        font-size: .8em;
        width: 2.5em;
        height: 2.5em;
        transition: .1s all;

        &:hover {
          transform: scale(.98);
        }
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
      border: 2px solid var(--text-color);
      transition: .1s all;
      background: none;
      color: var(--text-color);
      cursor: pointer;
      padding: 0.5em 1em;
      font-weight: bold;
      transition: .1s all;

      &:hover {
        transform: scale(.98);
      }
    }
  `,
  transfers: {
    rows: css`
      visibility: hidden;
      position: fixed;

      &[data-visible="true"] {
        visibility: visible;
        position: inherit;
      }
    `,
    container: css`
      overflow: auto;
      max-height: 350px;
      filter: contrast(0.95);
    `,
    item: css`
      display: flex;
      gap: .5em;
      align-items: center;
    `,
    button: css`
      padding: 0.3em .5em;
      border: 2px solid var(--text-color);
      border-radius: .5em;
      cursor: pointer;
      background: none;
      color: var(--text-color);
      display: flex;
      gap: .5em;
      align-items: center;
      opacity: .6;
      transition: .25s all;

      &:hover {
        opacity: 1;
      }
    `
  }
}
