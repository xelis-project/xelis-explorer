import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useMemo } from 'react'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'
import useLocale from 'g45-react/hooks/useLocale'

import { formatSize, formatXelis } from '../../utils'
import theme from '../../style/theme'
import { bounceIn, slideX } from '../../style/animate'
import Hashicon from '../../components/hashicon'
import { formatMiner } from '../../utils/known_addrs'
import { getBlockColor } from '../dag/blockColor'
import { useTheme } from '../../hooks/useTheme'
import { getBlockType } from '../dag'

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
  `,
  noAnimation: css`
    * {
      animation-duration: 0s !important;
    }
  `,
  block: {
    container: css`
      padding: 1em;
      min-width: 9em;
      background-color: var(--block-bg-color);
      border-left: .3em solid;
      border-radius: .25em;
      position: relative;
      flex-shrink: 0;
      text-decoration: none;
      display: block;
      user-select: none;
      cursor: pointer;
      ${slideX({ from: `-100%`, to: `0%`, duration: `.25s` })}

      &:hover {
        transform: scale(.9);
        animation-fill-mode: unset; /* important or the animation overwrite the transform */
      }

      ${theme.query.minDesktop} {
        border-top: .4em solid;
        border-left: none;
      }
    `,
    animate: css`
      ${bounceIn({ duration: `.8s` })};
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
    `,
    /*blockType: css`
      position: absolute;
      bottom: -.6rem;
      background: #0c0c0c;
      padding: .25rem .5rem;
      border-radius: .25rem;
      font-size: .9rem;
      transform: translateX(-50%);
      left: 50%;
      color: var(--muted-color);
    `*/
  }
}

export function RecentBlocks(props) {
  const { blocks, newBlock, info } = props

  const { t } = useLang()
  const { theme: currentTheme } = useTheme()
  const locale = useLocale()

  const newBlockHash = useMemo(() => {
    if (newBlock) return newBlock.hash
    return ``
  }, [newBlock])

  let recentBlocks = blocks
  if (recentBlocks.length === 0) recentBlocks = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]

  return <div>
    <div className={style.title}>{t('Recent Blocks')}</div>
    <div className={`${style.blocks} ${!newBlockHash ? style.noAnimation : ``}`}>
      {recentBlocks.map((block, index) => {
        const key = `${index}${block.hash}` //+ Math.random() // random key to force re-render and repeat animation
        const txCount = (block.txs_hashes || []).length
        const size = formatSize(block.total_size_in_bytes || 0, { locale })
        const topo = block.topoheight ? block.topoheight.toLocaleString(locale) : `?`

        let blockClassName = style.block.container
        if (newBlockHash === block.hash) {
          blockClassName += ` ${style.block.animate}`
        }

        const blockType = getBlockType(blocks, block, info.stableheight)
        const blockColor = getBlockColor(currentTheme, blockType)
        const title = t(`This is a {} block and the reward is {}.`, [blockType, formatXelis(block.reward, { locale })])

        return <Link to={`/blocks/${block.hash}`} key={key} className={blockClassName}
          style={{ borderColor: blockColor }} title={title}>
          <div className={style.block.title}>{t('Block {}', [topo])}</div>
          <div className={style.block.info}>{txCount} txs | {size}</div>
          <div className={style.block.miner}>
            <Hashicon value={block.miner} size={20} />
            {block.miner ? formatMiner(block.miner) : '--'}
          </div>
          <div className={style.block.age}>
            {block.timestamp ? <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} /> : `__`}
          </div>
        </Link>
      })}
    </div>
  </div>
}
