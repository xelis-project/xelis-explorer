import Button from '../../components/button'
import { Link, useNavigate } from 'react-router-dom'
import useNodeSocket, { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useNodeRPC from '../../hooks/useNodeRPC'
import Age from '../../components/age'
import { formatHashRate, formatSize, formatXelis, groupBy, reduceText } from '../../utils'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { getBlockType, BLOCK_COLOR } from '../dag'
import prettyMs from 'pretty-ms'

function ExplorerSearch() {
  const navigate = useNavigate()
  const nodeRPC = useNodeRPC()

  const search = useCallback(async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const searchValue = formData.get(`search`)
    if (searchValue === ``) return

    if (searchValue.length === 64) {
      const [err, block] = await to(nodeRPC.getBlockByHash(searchValue))
      if (block) {
        return navigate(`/blocks/${searchValue}`)
      } else {
        return navigate(`/txs/${searchValue}`)
      }
    }

    const height = parseInt(searchValue)
    if (!isNaN(height)) {
      return navigate(`/blocks/${height}`)
    }
  }, [])

  return <form onSubmit={search}>
    <div className="explorer-search">
      <div className="explorer-search-title">XELIS Explorer</div>
      <div className="explorer-search-form">
        <input type="text" name="search" placeholder="Search block, transaction or address"
          autoComplete="off" autoCapitalize="off" />
        <Button type="submit" icon="search" iconLocation="right" iconProps={{ style: { rotate: `90deg` } }}>
          Search
        </Button>
      </div>
    </div>
  </form>
}

function RecentBlocks() {
  const nodeRPC = useNodeRPC()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [blocks, setBlocks] = useState([])
  const [animateBlocks, setAnimateBlocks] = useState(false) // make sure to not animate on pageload and only when we get a new block

  const [stableHeight, setStableHeight] = useState()

  const loadStableHeight = useCallback(async () => {
    const [err, height] = await to(nodeRPC.getStableHeight())
    if (err) return console.log(err)

    setStableHeight(height)
  })

  const loadRecentBlocks = useCallback(async () => {
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, height] = await to(nodeRPC.getHeight())
    if (err1) return resErr(err1)

    const [err2, blocks] = await to(nodeRPC.getBlocksRangeByHeight(height - 19, height))
    if (err2) return resErr(err2)
    setLoading(false)

    setBlocks(blocks.reverse())
  }, [])

  useEffect(() => {
    loadStableHeight()
    loadRecentBlocks()
  }, [loadRecentBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
      loadStableHeight()
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })
      setAnimateBlocks(true)
    }
  }, [])

  useNodeSocketSubscribe({
    event: `BlockOrdered`,
    onData: (data) => {
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

  /*
  const blocks = useMemo(() => {
    const blocks = [...newBlocks, ...lastBlocks]
    // TEMP FIX - remove duplicate blocks (blockDAG can have block at same height)
    return blocks.filter((item, index, self) => {
      return index === self.findIndex(o => {
        return o.height === item.height
      })
    })
  }, [newBlocks, lastBlocks])*/

  useEffect(() => {
    if (blocks.length > 20) {
      blocks.pop()
      setBlocks(blocks)
    }
  }, [blocks])

  if (loading || err) return null

  return <div className="recent-blocks">
    <div className="recent-blocks-title">Recent Blocks</div>
    {/*<div className="recent-blocks-items">
      {blocks.map((item, index) => {
        const txCount = item.txs_hashes.length
        const size = formatSize(item.total_size_in_bytes || 0)
        const stableHeight = blocks[0].height - 8
        const statusClassName = item.height <= stableHeight ? `stable` : `mined`
        const key = index + Math.random() // random key to force re-render and repeat animation

        return <Link to={`/blocks/${item.height}`} key={key} className={`recent-blocks-item`}>
          <div className={`recent-blocks-item-status ${statusClassName}`} />
          <div className="recent-blocks-item-title">Block {item.height}</div>
          <div className="recent-blocks-item-value">{txCount} txs | {size}</div>
          <div className="recent-blocks-item-time">
            <Age timestamp={item.timestamp} update format={{ secondsDecimalDigits: 0 }} />
          </div>
          <div>{item.topoheight}</div>
        </Link>
      })}
    </div>*/}

    <div className="recent-blocks-items">
      {[...groupBy(blocks, (b) => b.height).entries()].map((entry, index) => {
        const [height, groupBlocks] = entry
        const key = index + Math.random() // random key to force re-render and repeat animation


        return <div className={`recent-blocks-group ${animateBlocks ? `animate` : ``}`} key={key}>
          <div className="recent-blocks-group-items">
            {groupBlocks.map((block) => {
              const txCount = block.txs_hashes.length
              const size = formatSize(block.total_size_in_bytes || 0)

              const blockType = getBlockType(block, stableHeight)
              const blockColor = BLOCK_COLOR[blockType]

              return <Link to={`/blocks/${block.hash}`} key={block.hash} className={`recent-blocks-item`}>
                <div className={`recent-blocks-item-status`} style={{ backgroundColor: blockColor }} />
                <div className="recent-blocks-item-title">Block {block.topoheight}</div>
                <div className="recent-blocks-item-value">{txCount} txs | {size}</div>
                <div className="recent-blocks-item-miner">{reduceText(block.miner, 0, 7)}</div>
                <div className="recent-blocks-item-time">
                  <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
                </div>
              </Link>
            })}
          </div>
          <div className="recent-blocks-group-title">
            Height {height}
          </div>
        </div>
      })}
    </div>
  </div>
}

function Stats() {
  const nodeSocket = useNodeSocket()

  const [info, setInfo] = useState({})
  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)

  const loadInfo = useCallback(async () => {
    setLoading(true)
    const [err, info] = await to(nodeSocket.sendMethod(`get_info`))
    if (err) return setErr(err)
    setInfo(info)
    setLoading(false)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onLoad: loadInfo,
    onData: loadInfo
  }, [])

  const stats = useMemo(() => {
    if (loading || err) return []

    const maxSupply = 1840000000000
    const mined = (info.native_supply * 100 / maxSupply).toFixed(2)
    console.log(info)
    return [
      { title: `Max Supply`, value: formatXelis(maxSupply) },
      { title: `Circulating Supply`, value: formatXelis(info.native_supply) },
      { title: `Mined`, value: `${mined}%` },
      { title: `Hashrate`, value: formatHashRate(info.difficulty / 15) },
      { title: `Block Reward`, value: formatXelis(info.block_reward) },
      { title: `Tx Pool`, value: `${info.mempool_size} tx` },
      { title: `Block Count`, value: info.topoheight },
      { title: `Difficulty`, value: info.difficulty },
      { title: `Avg Block Time`, value: prettyMs(info.average_block_time, { compact: true }) },
    ]
  }, [info])

  if (stats.length === 0) return null

  return <div className="home-stats">
    <div className="home-stats-title">Statistics</div>
    <div>
      For more detailed Statistics visit&nbsp;
      <a href="https://stats.xelis.io" target="_blank">https://stats.xelis.io</a>
    </div>
    <div className="home-stats-items">
      {stats.map((item) => {
        return <div key={item.title} className="home-stats-item">
          <div className="home-stats-item-title">{item.title}</div>
          <div className="home-stats-item-value">{item.value}</div>
        </div>
      })}
    </div>
  </div>
}

function P2PStatus() {
  const [err, setErr] = useState()
  const [p2pStatus, setP2PStatus] = useState()
  const nodeSocket = useNodeSocket()

  const loadP2PStatus = useCallback(async () => {
    const [err, p2pStatus] = await to(nodeSocket.sendMethod(`p2p_status`))
    if (err) return setErr(err)
    setP2PStatus(p2pStatus)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onLoad: loadP2PStatus,
    onData: loadP2PStatus
  }, [])

  return <div>{JSON.stringify(p2pStatus)}</div>
}

function Home() {
  return <div>
    <Helmet>
      <title>Home</title>
    </Helmet>
    <ExplorerSearch />
    {/*<P2PStatus />*/}
    <RecentBlocks />
    <Stats />
  </div>
}

export default Home
