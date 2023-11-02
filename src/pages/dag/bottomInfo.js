import { css } from 'goober'
import prettyMs from 'pretty-ms'
import { useLang } from 'g45-react/hooks/useLang'

import useTheme from '../../hooks/useTheme'
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
        padding: .5em 1em;
        border-radius: .5em;
  
        > :nth-child(1) {
          width: 12px;
          height: 12px;
          border-radius: .25em;
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
  const { t } = useLang()

  return <div className={style.container}>
    <div>
      {blockColor.types.map((key) => {
        return <div key={key}>
          <div style={{ backgroundColor: blockColor.value(currentTheme, key) }} />
          <div>{key}</div>
        </div>
      })}
    </div>
    <div>
      <div>
        <div>{prettyMs((info.average_block_time || 0), { compact: true })}</div>
        <div>{t('Block Time')}</div>
      </div>
      <div>
        <div>{(info.height || 0).toLocaleString()}</div>
        <div>{t('Height')}</div>
      </div>
      <div>
        <div>{(info.topoheight || 0).toLocaleString()}</div>
        <div>{t('Topo Height')}</div>
      </div>
      <div>
        <div>{(info.stableheight || 0).toLocaleString()}</div>
        <div>{t('Stable Height')}</div>
      </div>
    </div>
  </div>
}

export default BottomInfo