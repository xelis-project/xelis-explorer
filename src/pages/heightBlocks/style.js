import { css } from 'goober'

export default {
  list: css`
    display: flex;
    flex-direction: column;
    gap: 1em;
  `,
  item: {
    container: css`
      display: flex;
      gap: 2em;
      padding: 1em;
      border-radius: 1em;
      justify-content: space-between;
      align-items: center;
      background-color: var(--content-bg-color);
      overflow: auto;
      white-space: nowrap;
    `,
    title: css`
      color: var(--muted-color);
      margin-bottom: .5em;
    `,
    value: css`
      font-size: 1.2em;
    `,
    button: css`
      display: flex;
      gap: .5em;
      align-items: center;
      background-color: #00000030;
      padding: .5em .7em;
      border-radius: .5em;
      text-decoration: none;
      transition: .1s all;

      &:hover {
        transform: scale(.98);
      }
    `
  },
  miner: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
}
