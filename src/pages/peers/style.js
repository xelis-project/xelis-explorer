import { css } from 'goober'

import theme from '../../style/theme'

export default {
  container: css`
    > :nth-child(2) {
      background: var(--table-td-bg-color);
      padding: 1em;
      border-radius: 0.5em;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      font-size: .9em;
      display: flex;
      gap: .5em;
    }

    > :nth-child(3) {
      display: flex;
      flex-direction: column;
      gap: 1em;
  
      h2 {
        font-size: 1.2em;
        font-weight: bold;
        margin-top: 1em;
      }
    }
  `,
  tableRowLocation: css`
    display: flex;
    gap: .5em;
    align-items: center;

    ${theme.query.maxMobile} {
      flex-wrap: wrap;
    }

    button {
      background: var(--text-color);
      color: var(--bg-color);
      border: none;
      font-size: .7em;
      border-radius: 15px;
      padding: 0.3em 0.6em;
      font-weight: bold;
      cursor: pointer;
      transition: .1s all;

      &:hover {
        transform: scale(.98);
      }
    }
  `,
  map: css`
    position: relative;
    z-index: 0;
    width: 100%; 
    height: 15em;
    background-color: var(--bg-color);
    border-radius: .5em;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    
    ${theme.query.minDesktop} {
      height: 30em;
    }

    .leaflet-container {
      outline: none;
      width: 100%; 
      height: 100%;
      border-radius: .5em;
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      background: ${theme.apply({ xelis: `#262626`, dark: `#262626`, light: `#d5dadc` })};
    }

    .leaflet-popup-content-wrapper {
      border-radius: .5em;
    }

    .leaflet-popup-content {
      margin: 1em;

      > :nth-child(1) {
        font-weight: bold;
        padding-bottom: .5em;
        font-size: 1.1em;
      }

      > :nth-child(2) {
        font-size: .9em;
        max-height: 5em;
        overflow: auto;
        padding-right: 1em;
      }
    }
  `,
  mapControls: css`
    position: absolute;
    right: 0;
    z-index: 99999;
    padding: 1em;
    display: flex;
    gap: .5em;
    flex-direction: column;

    > div {
      display: flex;
      gap: 0.5em;
      align-items: center;
      font-weight: bold;
      font-size: .9em;
      justify-content: right;
    }

    button {
      background: var(--text-color);
      color: var(--bg-color);
      border: none;
      border-radius: 15px;
      padding: 0.3em 0.6em;
      font-weight: bold;
      cursor: pointer;
    }
  `,
  peerList: css`
    display: flex;
    gap: 1em;
    flex-direction: column;
  
    > :nth-child(3) {
      max-height: 40em;
    }
  `,
  peerInput: css`
    display: flex;
    flex-direction: column;
    gap: 1em;

    ${theme.query.minDesktop} {
      flex-direction: row;
    }

    > :nth-child(2) {
      display: flex;
      gap: 0.5em;
      flex-direction: column;
      min-width: 10em;
    }

    input {
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
    }
  `,
  peerStats: css`
    background-color: var(--content-bg-color);
    padding: 1.5em;
    border-radius: 1em;
    display: flex;
    gap: 1em;
    flex-direction: column;

    ${theme.query.minDesktop} {
      flex-direction: row;
    }

    > div {
      display: flex;
      gap: .5em;
      align-items: center;

      > :nth-child(1) {
        color: var(--muted-color);
        font-size: 1em;
      }

      > :nth-child(2) {
        font-size: 1.4em;
      }
    }
  `,
  chart: css`
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    gap: 1em;

    ${theme.query.minDesktop} {
      grid-template-rows: 1fr 1fr;
      grid-template-columns: 1fr 1fr;
    }

    > div {
      background-color: var(--content-bg-color);
      padding: 1.5em;
      border-radius: 1em;
      display: flex;
      flex-direction: column;
      gap: 1em;

      canvas {
        max-height: 15em;
      }
    }
  `
}
