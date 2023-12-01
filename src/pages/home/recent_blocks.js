import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useMemo } from 'react'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'

import { formatSize, reduceText } from '../../utils'
import theme from '../../style/theme'
import { bounceIn, slideX } from '../../style/animate'

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
  container: css`
    > :nth-child(1) {
      margin-bottom: 1em;
      font-weight: bold;
      font-size: 1.5em;
  
      > div {
        font-size: .6em;
        opacity: .7;
        font-weight: normal;
        margin-top: 5px;
      }
    }

    > :nth-child(2) {
      display: flex;
      gap: 1em;
      margin-bottom: 2em;
      padding-bottom: 1em;
      overflow-x: auto;
  
      &.no-animation * {
        animation-duration: 0s !important;
      }
  
      a {
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
  
        > :nth-child(1) {
          color: var(--text-color);
          font-weight: bold;
          margin-bottom: .25em;
          white-space: nowrap;
        }
      
        > :nth-child(2) {
          color: var(--muted-color);
          font-weight: bold;
          font-size: .9em;
          white-space: nowrap;
        }
      
        > :nth-child(3) {
          font-size: .9em;
          margin-top: .2em;
          color: var(--muted-color);
          opacity: .6;
          font-style: italic;
        }
      
        > :nth-child(4) {
          font-weight: bold;
          font-size: .9em;
          margin-top: .4em;
          color: var(--link-color);
        }
      }
    }
  `
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

  return <div className={style.container}>
    <div>{t('Recent Blocks')}</div>
    <div className={`${!newBlockHash ? `no-animation` : ``}`}>
      {recentBlocks.map((block, index) => {
        const key = `${index}${block.hash}` //+ Math.random() // random key to force re-render and repeat animation
        const txCount = (block.txs_hashes || []).length
        const size = formatSize(block.total_size_in_bytes || 0)
        const animateClassName = newBlockHash === block.hash ? `animate` : null

        return <Link to={`/blocks/${block.hash}`} key={key} className={animateClassName}>
          <div>{t('Block {}', [block.topoheight || ``])}</div>
          <div>{txCount} txs | {size}</div>
          <div>{reduceText(block.miner, 0, 7) || '--'}</div>
          <div>
            {block.timestamp ?
              <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
              : '--'}
          </div>
        </Link>
      })}
    </div>
  </div>
}
