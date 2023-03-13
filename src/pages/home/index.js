import Button from '../../components/button'
import { Link, useNavigate } from 'react-router-dom'
import useNodeSocket, { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useNodeRPC from '../../hooks/useNodeRPC'
import bytes from 'bytes'
import Age from '../../components/age'
import { formatHashRate, formatXelis, groupBy, reduceText } from '../../utils'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import Chart from '../../components/chart'

function ExplorerSearch() {
  const navigate = useNavigate()

  const search = useCallback((e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const searchValue = formData.get(`search`)
    if (searchValue === ``) return

    if (searchValue.length === 64) {
      return navigate(`/tx/${searchValue}`)
    }

    const height = parseInt(searchValue)
    if (!isNaN(height)) {
      return navigate(`/block/${height}`)
    }
  }, [])

  return <form onSubmit={search}>
    <div className="explorer-search">
      <div className="explorer-search-title">Xelis Explorer</div>
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

function RecentBlocks(props) {
  const nodeSocket = useNodeSocket()
  const nodeRPC = useNodeRPC()

  const [blocks, setBlocks] = useState([])
  const [animateBlocks, setAnimateBlocks] = useState(false) // make sure to not animate on pageload and only when we get a new block

  const loadRecentBlocks = useCallback(async () => {
    const [err1, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err1) return console.log(err1)

    const [err2, blocks] = await to(nodeRPC.getBlocks(topoheight - 10, topoheight))
    if (err2) return console.log(err2)

    setBlocks(blocks.reverse())
  }, [])

  useEffect(() => {
    loadRecentBlocks()
  }, [loadRecentBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
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
      const { topoheight, block_hash } = data
      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) block.topoheight = topoheight
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
    if (blocks.length >= 10) {
      blocks.pop()
      setBlocks(blocks)
    }
  }, [blocks])

  return <div className="recent-blocks">
    <div className="recent-blocks-title">Recent Blocks</div>
    {/*<div className="recent-blocks-items">
      {blocks.map((item, index) => {
        const txCount = item.txs_hashes.length
        const size = bytes.format(item.total_size_in_bytes || 0)
        const stableHeight = blocks[0].height - 8
        const statusClassName = item.height <= stableHeight ? `stable` : `mined`
        const key = index + Math.random() // random key to force re-render and repeat animation

        return <Link to={`/block/${item.height}`} key={key} className={`recent-blocks-item`}>
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
              const size = bytes.format(block.total_size_in_bytes || 0)

              let statusClassName = `mined`
              switch (block.block_type) {
                case 'Sync':
                case 'Side':
                  statusClassName = `stable`
              }

              return <Link to={`/block/${block.hash}`} key={block.hash} className={`recent-blocks-item`}>
                <div className={`recent-blocks-item-status ${statusClassName}`} />
                <div className="recent-blocks-item-title">Block {block.topoheight}</div>
                <div className="recent-blocks-item-value">{txCount} txs | {size}</div>
                <div className="recent-blocks-item-miner">{reduceText(block.miner)}</div>
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

function HomeMiniChart(props) {
  const { labels, datasets } = props

  const chartData = useMemo(() => {
    let rnd = []
    for (let i = 0; i < 6; i++) {
      rnd.push(Math.random())
    }

    return {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'Units',
        data: rnd,
        borderColor: '#1870cb',
        borderWidth: 4,
        tension: .3
      }]
    }
  }, [])

  const chartConfig = useMemo(() => {
    return {
      type: 'line',
      data: chartData,
      options: {
        maintainAspectRatio: false,
        elements: {
          point: {
            radius: 0
          }
        },
        plugins: {
          legend: {
            display: false
          },
        },
        scales: {
          y: {
            display: false,
            beginAtZero: false
          },
          x: {
            display: false
          }
        }
      }
    }
  }, [chartData])

  return <Chart config={chartConfig} className="home-stats-chart" />
}

function Stats() {
  const nodeSocket = useNodeSocket()

  const [info, setInfo] = useState({})

  const [err, setErr] = useState()
  const loadInfo = useCallback(async () => {
    const [err, info] = await to(nodeSocket.sendMethod(`get_info`))
    if (err) return setErr(err)
    setInfo(info)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onLoad: loadInfo,
    onData: loadInfo
  }, [])

  const stats = useMemo(() => {
    return [
      { title: `Hash rate`, value: formatHashRate(info.difficulty / 15) }, // 100 MH/s
      { title: `Total txs`, value: `?` }, // 34.44 M
      { title: `TPS`, value: `?` }, // 10.5
      { title: `Difficulty`, value: info.difficulty }, // 4534454
      { title: `Total supply`, value: formatXelis(info.native_supply) }, // 145230
      { title: `Tx pool`, value: `${info.mempool_size} tx` }, // 5 tx
      { title: `Avg block size`, value: `?` }, // 10B
      { title: `Avg block time`, value: `?` }, // 18s
      { title: `Blockchain size`, value: `?` }, // 1.5GB
    ]
  }, [info])

  return <div className="home-stats">
    <div className="home-stats-title">Realtime Stats</div>
    <div className="home-stats-items">
      {stats.map((item) => {
        return <div key={item.title} className="home-stats-item">
          <div className="home-stats-item-title">{item.title}</div>
          <div className="home-stats-item-value">{item.value}</div>
          <HomeMiniChart />
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
    <P2PStatus />
    <RecentBlocks />
    <Stats />
  </div>
}

export default Home
