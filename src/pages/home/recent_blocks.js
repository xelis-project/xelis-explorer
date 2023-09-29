import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { useCallback, useEffect, useState } from 'react'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/context'

import Age from '../../components/age'
import { formatSize, reduceText } from '../../utils'
import theme from '../../style/theme'
import { bounceIn, scaleOnHover, slideRight } from '../../style/animate'

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
  items: css`
    display: flex;
    gap: 1em;
    margin-bottom: 2em;
    padding-bottom: 1em;
    overflow-x: auto;

    &.no-animation * {
      animation-duration: 0s !important;
    }

    .item {
      padding: 1em;
      min-width: 9em;
      background-color: var(--block-bg-color);
      border-left: 3px solid var(--block-border-color);
      position: relative;
      flex-shrink: 0;
      text-decoration: none;
      display: block;
      user-select: none;
      cursor: pointer;
      ${scaleOnHover}
      ${slideRight({ from: `-100%`, to: `0%`, duration: `.25s` })}

      ${theme.query.minDesktop} {
        border-top: 3px solid var(--block-border-color);
        border-left: none;
      }

      &.animate {
        ${bounceIn({ duration: `.8s` })};
      }

      .title {
        color: var(--text-color);
        font-weight: bold;
        margin-bottom: .25em;
      }
    
      .value {
        color: var(--muted-color);
        font-weight: bold;
        font-size: .9em;
      }
    
      .miner {
        font-size: .9em;
        margin-top: .2em;
        color: var(--muted-color);
        opacity: .6;
        font-style: italic;
      }
    
      .time {
        font-weight: bold;
        font-size: .9em;
        margin-top: .4em;
        color: var(--link-color);
      }
    }
  `
}

export function RecentBlocks() {
  const nodeSocket = useNodeSocket()

  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const [blocks, setBlocks] = useState(() => {
    return [{}, {}, {}, {}, {}, {}, {}]
  })
  const [animateBlock, setAnimateBlock] = useState('')

  const loadRecentBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, height] = await to(nodeSocket.daemon.getHeight())
    if (err1) return resErr(err1)

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByHeight({
      start_height: height - 19,
      end_height: height
    }))
    if (err2) return resErr(err2)
    setLoading(false)

    setBlocks(blocks.reverse())
  }, [nodeSocket])

  useEffect(() => {
    loadRecentBlocks()
  }, [loadRecentBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (_, newBlock) => {
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })
      setAnimateBlock(newBlock.hash)
    }
  }, [])

  useNodeSocketSubscribe({
    event: `BlockOrdered`,
    onData: (_, data) => {
      const { topoheight, block_hash, block_type } = data
      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          block.topoheight = topoheight
          block.block_type = block_type
        }
        return block
      }))
    }
  }, [])

  useEffect(() => {
    if (blocks.length > 20) {
      blocks.pop()
      setBlocks(blocks)
    }
  }, [blocks])

  return <div>
    <div className={style.title}>Recent Blocks</div>
    <div className={`${style.items} ${!animateBlock ? `no-animation` : ``}`}>
      {blocks.map((block, index) => {
        const key = index //+ Math.random() // random key to force re-render and repeat animation
        const txCount = (block.txs_hashes || []).length
        const size = formatSize(block.total_size_in_bytes || 0)
        return <div key={key}>
          <Link to={`/blocks/${block.hash}`} key={block.hash} className={`item ${animateBlock === block.hash ? `animate` : ``}`}>
            <div className="title">Block {block.topoheight}</div>
            <div className="value">{txCount} txs | {size}</div>
            <div className="miner">{reduceText(block.miner, 0, 7) || '--'}</div>
            <div className="time">
              {block.timestamp ?
                <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
                : '--'}
            </div>
          </Link>
        </div>
      })}
    </div>
  </div>
}