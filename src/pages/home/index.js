import Button from '../../components/button'
import { Link, useNavigate } from 'react-router-dom'
import useNodeSocket from '../../context/useNodeSocket'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useNodeRPC from '../../hooks/useNodeRPC'
import DotLoading from '../../components/dotLoading'
import bytes from 'bytes'
import Age from '../../components/age'
import { formatXelis, groupBy, reduceText } from '../../utils'
import { Helmet } from 'react-helmet'
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
      return navigate(`/txs/${searchValue}`)
    }

    const height = parseInt(searchValue)
    if (!isNaN(height)) {
      return navigate(`/blocks/${height}`)
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

function NodeConnection(props) {
  const { info = {} } = props
  const { connected, loading, err } = useNodeSocket()

  return <div className="node-connection">
    {loading && <>
      <div className="node-connection-status loading" />
      <div>Connecting to remote node<DotLoading /></div>
    </>}
    {connected && <>
      <div className="node-connection-status alive" />
      <div>Connected to remote node (version: {info.version})</div>
    </>}
    {err && <>
      <div className="node-connection-status error" />
      <div>Remote node connection: {err.message}</div>
    </>}
    {!loading && !connected && !err && <>
      <div className="node-connection-status error" />
      <div>Disconnected from remote node</div>
    </>}
  </div>
}

function RecentBlocks(props) {
  const { info } = props

  const nodeSocket = useNodeSocket()
  const nodeRPC = useNodeRPC()

  const [blocks, setBlocks] = useState([])

  const loadRecenBlocks = useCallback(async () => {
    if (!info) return

    const [err1, blocks] = await to(nodeRPC.getBlocks(info.topoheight - 10, info.topoheight))
    if (err1) return console.log(err1)

    setBlocks(blocks.reverse())
  }, [info])

  useEffect(() => {
    loadRecenBlocks()
  }, [loadRecenBlocks])

  useEffect(() => {
    if (!nodeSocket.connected) return

    const unsubscribe = nodeSocket.onNewBlock((block) => {
      setBlocks((blocks) => [block, ...blocks])
    })

    return () => {
      unsubscribe()
    }
  }, [nodeSocket.connected, nodeSocket.onNewBlock])

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

        return <div className="recent-blocks-group" key={key}>
          <div className="recent-blocks-group-items">
            {groupBlocks.map((block) => {
              const txCount = block.txs_hashes.length
              const size = bytes.format(block.total_size_in_bytes || 0)
              const statusClassName = block.block_type === `Sync` ? `stable` : `mined`

              return <Link to={`/blocks/${block.topoheight}`} key={block.topoheight} className={`recent-blocks-item`}>
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
            DAG Height: {height}
          </div>
        </div>
      })}
    </div>
  </div>
}

function HomeMiniChart(props) {
  const { labels, datasets } = props

  const data = useMemo(() => {
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

  const chart = useMemo(() => {
    return {
      type: 'line',
      data: data,
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
  }, [])

  return <Chart chart={chart} className="home-stats-chart" />
}

function Stats(props) {
  const { info } = props
  /*const stats = [
    { title: `Hash rate`, value: `100 MH/s` },
    { title: `Total txs`, value: `34.44 M` },
    { title: `TPS`, value: `10.5` },
    { title: `Difficulty`, value: `4534454` },
    { title: `Total supply`, value: `145230` },
    { title: `Tx pool`, value: `5 tx` },
    { title: `Avg block size`, value: `10 bytes` },
    { title: `Avg block time`, value: `18s` },
    { title: `Blockchain size`, value: `1.5 GB` },
  ]*/

  const stats = useMemo(() => {
    return [
      { title: `Hash rate`, value: `?` },
      { title: `Total txs`, value: `?` },
      { title: `TPS`, value: `?` },
      { title: `Difficulty`, value: info.difficulty },
      { title: `Total supply`, value: formatXelis(info.native_supply) },
      { title: `Tx pool`, value: `${info.mempool_size} tx` },
      { title: `Avg block size`, value: `?` },
      { title: `Avg block time`, value: `?` },
      { title: `Blockchain size`, value: `?` },
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

function Home() {
  const nodeRPC = useNodeRPC()
  const [info, setInfo] = useState()
  const [peerStatus, setPeerStatus] = useState()

  const [err, setErr] = useState()
  const load = useCallback(async () => {
    const [err1, info] = await to(nodeRPC.getInfo())
    if (err1) return setErr(err)
    setInfo(info)

    const [err2, p2pStatus] = await to(nodeRPC.p2pStatus())
    if (err2) return setErr(err2)
    setPeerStatus(p2pStatus)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return <div>
    <Helmet>
      <title>Home</title>
    </Helmet>
    <ExplorerSearch />
    <NodeConnection info={info} />
    {info && <>
      <RecentBlocks info={info} />
      <Stats info={info} />
    </>}
  </div>
}

export default Home
