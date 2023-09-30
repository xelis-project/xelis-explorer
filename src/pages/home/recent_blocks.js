import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/context'

import Age from '../../components/age'
import { formatSize, formatXelis, reduceText } from '../../utils'
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

    > div {
      font-size: .6em;
      opacity: .7;
      font-weight: normal;
      margin-top: 5px;
    }
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
        white-space: nowrap;
      }
    
      .value {
        color: var(--muted-color);
        font-weight: bold;
        font-size: .9em;
        white-space: nowrap;
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
  `,
  stats: css`
    margin-bottom: 2em;

    .items {
      display: flex;
      gap: 1em;
      margin-bottom: 1em;
      padding-bottom: 1em;
      overflow: auto;

      > div {
        padding: 1em;
        border-left: 3px solid var(--block-border-color);
        background-color: var(--block-bg-color);
        min-width: 9em;

        > :nth-child(1) {
          color: var(--muted-color);
          font-size: .9em;
          margin-bottom: .5em;
        }

        > :nth-child(2) {
          font-size: 1.6em;
        }
      }
    }

    .distribution {
      display: flex;
      flex-direction: column;
      border-left: 3px solid var(--block-border-color);
      background-color: var(--stats-bg-color);

      > div {
        display: flex;
        align-items: center;

        > :nth-child(1) {
          padding: .7em;
          min-width: 100px;
          background-color: var(--block-bg-color);
        }

        > :nth-child(2) {
          padding: .7em;
          color: white;
          overflow: hidden;
          font-weight: bold;
          white-space: nowrap;
        }
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
  const [stats, setStats] = useState({
    txs: 0, size: 0, fees: 0, miners: {}, reward: 0,
    syncBlocks: 0, normalBlocks: 0, sideBlocks: 0, orphanedBlocks: 0
  })

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
    if (blocks.length > 50) {
      blocks.pop()
      setBlocks(blocks)
    }

    let txs = 0
    let size = 0
    let fees = 0
    let reward = 0
    let miners = {}
    let syncBlocks = 0
    let normalBlocks = 0
    let sideBlocks = 0
    let orphanedBlocks = 0
    blocks.forEach(block => {
      if (Object.keys(block).length == 0) return

      txs += (block.txs_hashes || 0).length
      size += block.total_size_in_bytes || 0
      fees += block.total_fees || 0
      reward += block.reward || 0
      syncBlocks += block.block_type == 'Sync' ? 1 : 0
      normalBlocks += block.block_type == 'Normal' ? 1 : 0
      sideBlocks += block.block_type == 'Side' ? 1 : 0
      orphanedBlocks += block.block_type == 'Orphaned' ? 1 : 0

      if (!miners[block.miner]) {
        miners[block.miner] = 1
      } else {
        miners[block.miner]++
      }
    })

    setStats({ txs, size, fees, miners, reward, syncBlocks, normalBlocks, sideBlocks, orphanedBlocks })
  }, [blocks])

  return <div>
    <div className={style.title}>Recent Blocks</div>
    <div className={`${style.items} ${!animateBlock ? `no-animation` : ``}`}>
      {blocks.map((block, index) => {
        const key = index //+ Math.random() // random key to force re-render and repeat animation
        const txCount = (block.txs_hashes || []).length
        const size = formatSize(block.total_size_in_bytes || 0)
        return <div key={key}>
          <Link to={`/blocks/${block.hash}`} key={block.hash} className={`item ${animateBlock == block.hash ? `animate` : ``}`}>
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
    <div className={style.title}>
      Recent Stats
      <div>From last {blocks.length} blocks</div>
    </div>
    <div className={style.stats}>
      <div className="items">
        <div>
          <div>Txs</div>
          <div>{stats.txs}</div>
        </div>
        <div>
          <div>Size</div>
          <div>{formatSize(stats.size)}</div>
        </div>
        <div>
          <div>Fees</div>
          <div>{formatXelis(stats.fees, { withSuffix: false })}</div>
        </div>
        <div>
          <div>Reward</div>
          <div>{formatXelis(stats.reward, { withSuffix: false })}</div>
        </div>
        <div title={`(sync, normal, side, orphan)`}>
          <div>Blocks</div>
          <div>
            {stats.syncBlocks} / {stats.normalBlocks} / {stats.sideBlocks} / {stats.orphanedBlocks}
          </div>
        </div>
      </div>
      <div className={style.title}>
        Miners Distribution
        <div>From last {blocks.length} blocks</div>
      </div>
      <div className="distribution">
        <MinersDistribution miners={stats.miners} />
      </div>
    </div>
  </div>
}

const minersMock = {
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k1": 45,
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k2": 31,
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k3": 5,
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k4": 12,
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k5": 22,
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k6": 5,
  "xet1qqqyvh9vgkcurtj2la0e4jspnfsq7vkaqm863zcfdnej92xg4mpzz3suf96k7": 2,
}

const colors = [
  'rgba(221, 90, 57, 0.4)', 'rgba(42, 177, 211, 0.4)', 'rgba(109, 255, 177, 0.4)', 'rgba(36, 34, 155, 0.4)',
  'rgba(161, 186, 40, 0.4)', 'rgba(99, 255, 210, 0.4)', 'rgba(206, 26, 89, 0.4)', 'rgba(69, 247, 164, 0.4)',
  'rgba(232, 204, 0, 0.4)', 'rgba(25, 160, 120, 0.4)', 'rgba(9, 116, 239, 0.4)', 'rgba(62, 170, 178, 0.4)',
  'rgba(137, 237, 104, 0.4)', 'rgba(117, 237, 87, 0.4)', 'rgba(196, 98, 7, 0.4)', 'rgba(28, 100, 119, 0.4)',
  'rgba(22, 164, 247, 0.4)', 'rgba(183, 119, 36, 0.4)', 'rgba(80, 3, 127, 0.4)', 'rgba(62, 165, 28, 0.4)',
]


function MinersDistribution(props) {
  const { miners } = props

  const distribution = useMemo(() => {
    const values = Object.entries(miners).map(([miner, minedBlock]) => {
      return { miner, minedBlock }
    })

    values.sort((a, b) => b.minedBlock - a.minedBlock)
    return values
  }, [miners])

  return <>
    {distribution.map((item, index) => {
      const percentage = item.minedBlock * 100 / distribution[0].minedBlock
      return <div key={item.miner}>
        <div title={item.miner}>{reduceText(item.miner, 0, 5)}</div>
        <div title={`${item.minedBlock} mined blocks`}
          style={{ width: `${percentage}%`, backgroundColor: colors[index] }}>
          {item.minedBlock}
        </div>
      </div>
    })}
  </>
}