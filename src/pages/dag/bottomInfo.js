import { css } from 'goober'
import prettyMs from 'pretty-ms'
import { useLang } from 'g45-react/hooks/useLang'

import useTheme from '../../hooks/useTheme'
import { getBlockColor } from './blockColor'
import theme from '../../style/theme'
import { BlockType } from '@xelis/sdk/daemon/types'

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
  `,
  blockTypes: {
    container: css`
      display: flex;
      flex-wrap: wrap;
      gap: .5em;
    `,
    item: css`
      display: flex;
      align-items: center;
      gap: .5em;
      background-color: rgb(0 0 0 / 20%);
      padding: .5em 1em;
      border-radius: .5em;
    `,
    dot: css`
      width: 12px;
      height: 12px;
      border-radius: .25em;
    `
  },
  info: {
    container: css`
      display: flex;
      flex-wrap: wrap;
      gap: 1.5em;
    `,
    title: css`
      font-size: 1.2em;
      margin-bottom: .2em;
    `,
    value: css`
      font-size: .8em;
      color: var(--muted-color);
    `
  }
}

function BottomInfo(props) {
  const { info } = props

  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  return <div className={style.container}>
    <div className={style.blockTypes.container}>
      {[BlockType.Sync, BlockType.Normal, BlockType.Side, BlockType.Orphaned].map((key) => {
        return <div key={key} className={style.blockTypes.item}>
          <div className={style.blockTypes.dot} style={{ backgroundColor: getBlockColor(currentTheme, key) }} />
          <div>{key}</div>
        </div>
      })}
    </div>
    <div className={style.info.container}>
      <div>
        <div className={style.info.title}>{prettyMs((info.average_block_time || 0), { compact: true })}</div>
        <div className={style.info.value}>{t('Block Time')}</div>
      </div>
      <div>
        <div className={style.info.title}>{(info.height || 0).toLocaleString()}</div>
        <div className={style.info.value}>{t('Height')}</div>
      </div>
      <div>
        <div className={style.info.title}>{(info.topoheight || 0).toLocaleString()}</div>
        <div className={style.info.value}>{t('Topo Height')}</div>
      </div>
      <div>
        <div className={style.info.title}>{(info.stableheight || 0).toLocaleString()}</div>
        <div className={style.info.value}>{t('Stable Height')}</div>
      </div>
    </div>
  </div>
}

export default BottomInfo