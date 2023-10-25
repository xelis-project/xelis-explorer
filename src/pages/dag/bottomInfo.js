import { css } from 'goober'
import prettyMs from 'pretty-ms'

import useTheme from '../../context/useTheme'
import blockColor from './blockColor'
import theme from '../../style/theme'

const style = {
  container: css`
    position: fixed;
    bottom: 0;
    padding: 1em;
    display: flex;
    gap: 1em;
    flex-direction: column;
    padding: 1em;
    width: 100%;
    justify-content: center;

    ${theme.query.minDesktop} {
      flex-direction: row;
      justify-content: space-between;
    }

    > :nth-child(1) {
      display: flex;
      flex-wrap: wrap;
      gap: .5em;
  
      > div {
        display: flex;
        align-items: center;
        gap: .5em;
        background-color: rgb(0 0 0 / 20%);
        padding: .5em;
  
        > :nth-child(2) {
          width: 12px;
          height: 12px;
        }
      }
    }

    > :nth-child(2) {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5em;

      > div {
        > :nth-child(1) {
          font-size: 1.2em;
          margin-bottom: .2em;
        }
  
        > :nth-child(2) {
          font-size: .8em;
          color: var(--muted-color);
        }
      }
    }
  `
}

function BottomInfo(props) {
  const { info } = props

  const { theme: currentTheme } = useTheme()

  return <div className={style.container}>
    <div>
      {blockColor.types.map((key) => {
        return <div key={key}>
          <div>{key}</div>
          <div style={{ backgroundColor: blockColor.value(currentTheme, key) }} />
        </div>
      })}
    </div>
    <div>
      <div>
        <div>{prettyMs((info.average_block_time || 0), { compact: true })}</div>
        <div>Block Time</div>
      </div>
      <div>
        <div>{(info.height || 0).toLocaleString()}</div>
        <div>Height</div>
      </div>
      <div>
        <div>{(info.topoheight || 0).toLocaleString()}</div>
        <div>Topoheight</div>
      </div>
      <div>
        <div>{(info.stableheight || 0).toLocaleString()}</div>
        <div>Stable Height</div>
      </div>
    </div>
  </div>
}

export default BottomInfo