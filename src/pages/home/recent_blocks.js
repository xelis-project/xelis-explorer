import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useMemo } from 'react'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'

import { formatSize } from '../../utils'
import theme from '../../style/theme'
import { bounceIn, slideX } from '../../style/animate'
import Hashicon from '../../components/hashicon'
import { formatMiner } from '../../utils/pools'

theme.xelis`
  --block-bg-color: #0c0c0c;
  --block-text-color: white;
  --block-border-color: var(--link-color);
`

theme.light`
  --block-bg-color: #e7e7e7;
  --block-text-color: black;
  --block-border-color: black;
`

theme.dark`
  --block-bg-color: #0c0c0c;
  --block-text-color: white;
  --block-border-color: white;
`

const style = {
  title: css`
    margin-bottom: 1em;
    font-weight: bold;
    font-size: 1.5em;
  `,
  blocks: css`
    display: flex;
    gap: 1em;
    margin-bottom: 2em;
    padding-bottom: 1em;
    overflow-x: auto;

    &.no-animation * {
      animation-duration: 0s !important;
    }
  `,
  block: {
    container: css`
      padding: 1em;
      min-width: 9em;
      background-color: var(--block-bg-color);
      border-left: .3em solid var(--block-border-color);
      border-radius: .25em;
      position: relative;
      flex-shrink: 0;
      text-decoration: none;
      display: block;
      user-select: none;
      cursor: pointer;
      ${slideX({ from: `-100%`, to: `0%`, duration: `.25s` })}

      ${theme.query.minDesktop} {
        border-top: 3px solid var(--block-border-color);
        border-left: none;
      }

      &.animate {
        ${bounceIn({ duration: `.8s` })};
      }
    `,
    title: css`
      color: var(--text-color);
      font-weight: bold;
      margin-bottom: .25em;
      white-space: nowrap;
    `,
    info: css`
      color: var(--muted-color);
      font-weight: bold;
      font-size: .9em;
      white-space: nowrap;
    `,
    miner: css`
      font-size: .9em;
      margin-top: .3em;
      color: var(--muted-color);
      opacity: .6;
      font-style: italic;
      display: flex;
      gap: .5em;
      align-items: center;
    `,
    age: css`
      font-weight: bold;
      font-size: .9em;
      margin-top: .4em;
      color: var(--link-color);
    `
  }
}

export function RecentBlocks(props) {
  const { blocks, newBlock } = props

  const { t } = useLang()

  const newBlockHash = useMemo(() => {
    if (newBlock) return newBlock.hash
    return ``
  }, [newBlock])

  let recentBlocks = blocks
  if (recentBlocks.length === 0) recentBlocks = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]

  return <div>
    <div className={style.title}>{t('Recent Blocks')}</div>
    <div className={`${style.blocks} ${!newBlockHash ? `no-animation` : ``}`}>
      {recentBlocks.map((block, index) => {
        const key = `${index}${block.hash}` //+ Math.random() // random key to force re-render and repeat animation
        const txCount = (block.txs_hashes || []).length
        const size = formatSize(block.total_size_in_bytes || 0)
        const animateClassName = newBlockHash === block.hash ? `animate` : null
        const topo = block.topoheight ? block.topoheight.toLocaleString() : ``

        return <Link to={`/blocks/${block.hash}`} key={key} className={`${style.block.container} ${animateClassName}`}>
          <div className={style.block.title}>{t('Block {}', [topo])}</div>
          <div className={style.block.info}>{txCount} txs | {size}</div>
          <div className={style.block.miner}>
            <Hashicon value={block.miner} size={20} />
            {block.miner ? formatMiner(block.miner) : '--'}
          </div>
          <div className={style.block.age}>
            {block.timestamp ?
              <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
              : '--'}
          </div>
        </Link>
      })}
    </div>
  </div>
}
