import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import prettyMs from 'pretty-ms'

import TableBody, { style as tableStyle } from '../../components/tableBody'
import { formatXelis, reduceText } from '../../utils'
import Age from '../../components/age'
import Chart from '../../components/chart'
import theme from '../../style/theme'
import { useRecentBlocks } from '../../pages/home'
import useTheme from '../../context/useTheme'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    h2 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 1.2em;
    }

    input {
      padding: 0.7em;
      border-radius: 10px;
      border: none;
      outline: none;
      font-size: 1.2em;
      background-color: ${theme.apply({ xelis: `rgb(0 0 0 / 20%)`, light: `rgb(255 255 255 / 20%)`, dark: `rgb(0 0 0 / 20%)` })};
      color: var(--text-color);
      width: 100%;
      border: thin solid ${theme.apply({ xelis: `#7afad3`, light: `#cbcbcb`, dark: `#373737` })};

      &::placeholder {
        color: ${theme.apply({ xelis: `rgb(255 255 255 / 20%)`, light: `rgb(0 0 0 / 30%)`, dark: `rgb(255 255 255 / 20%)` })};
        opacity: 1;
      }
    }

    .chart {
      max-height: 200px;
      margin-bottom: 1em;
    }

    > div > :nth-child(3) {
      display: grid;
      gap: 1em;
      grid-template-columns: 1fr;
      overflow-x: auto;
      padding-bottom: 1em;

      ${theme.query.minLarge} {
        grid-template-columns: 1fr 1fr;
      }

      > div > div {
        overflow-y: auto;
        max-height: 30em;
        
        table {
          thead tr th {
            position: sticky;
            top: 0;
          }
        }
      }
    }
  `
}

function MemPool() {
  const [memPool, setMemPool] = useState([])
  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const nodeSocket = useNodeSocket()
  const [filterTx, setFilterTx] = useState()

  const loadMemPool = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err, data] = await to(nodeSocket.daemon.getMemPool())
    if (err) return resErr(err)
    setMemPool(data)
    setLoading(false)
  }, [nodeSocket])

  useEffect(() => {
    loadMemPool()
  }, [loadMemPool])

  useNodeSocketSubscribe({
    event: RPCEvent.TransactionAddedInMempool,
    onData: (_, data) => {
      setMemPool((pool) => [data, ...pool])
    }
  }, [])

  return <div className={style.container}>
    <Helmet>
      <title>Mempool</title>
    </Helmet>
    <h1>Mempool</h1>
    <div>
      <TxsHistoryChart />
      <input type="text" placeholder="Type your account address or transaction hash to filter the list below." onChange={(e) => {
        setFilterTx(e.target.value)
      }} />
      <div>
        <PendingTxs memPool={memPool} err={err} loading={loading} />
        <ExecutedTxs setMemPool={setMemPool} />
      </div>
    </div>
  </div>
}

function TxsHistoryChart(props) {
  //const { data } = props
  const { blocks } = useRecentBlocks()
  const { theme: currentTheme } = useTheme()

  const totalTxs = useMemo(() => {
    return blocks.reduce((t, block) => t + block.txs_hashes.length, 0)
  }, [blocks])

  const chartConfig = useMemo(() => {
    const lastBlocks = Object.assign([], blocks).reverse()
    const labels = lastBlocks.map((block) => {
      return prettyMs(new Date().getTime() - block.timestamp, { secondsDecimalDigits: 0 })
    })

    const data = lastBlocks.map((block) => {
      return block.txs_hashes.length
    })

    const chartData = {
      labels,
      datasets: [{
        label: 'Txs',
        data,
        backgroundColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
      }]
    }

    return {
      type: 'bar',
      data: chartData,
      options: {
        animation: {
          duration: 0
        },
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
        },
        scales: {
          y: {
            ticks: {
              color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
              beginAtZero: true,
              precision: 0
            }
          },
          x: {
            ticks: {
              color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`
            }
          }
        }
      }
    }
  }, [blocks, currentTheme])

  return <div>
    <h2>Last 20 blocks ({totalTxs} txs)</h2>
    <Chart config={chartConfig} className="chart" />
  </div>
}


function PendingTxs(props) {
  const { memPool, loading, err } = props

  return <div>
    <h2>Pending Transactions ({memPool.length})</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th title="Transfers">T</th>
            <th>Signer</th>
            <th>Fees</th>
            <th>Age</th>
          </tr>
        </thead>
        <TableBody list={memPool} loading={loading} err={err} colSpan={5} emptyText="No transactions"
          onItem={(item) => {
            const transfers = item.data.transfers || []
            return <tr key={item.hash}>
              <td title={item.hash}>
                <Link to={`/txs/${item.hash}`}>{reduceText(item.hash)}</Link>
              </td>
              <td>{transfers.length}</td>
              <td>
                <Link to={`/accounts/${item.owner}`}>{reduceText(item.owner, 0, 7)}</Link>
              </td>
              <td>{formatXelis(item.fee)}</td>
              <td>
                <Age timestamp={(item.first_seen || 0) * 1000} update format={{ secondsDecimalDigits: 0 }} />
              </td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

function ExecutedTxs(props) {
  const { setMemPool } = props

  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const [executedTxs, setExecutedTxs] = useState([])
  const nodeSocket = useNodeSocket()
  const [topoheight, setTopoheight] = useState()

  const loadExecutedTxs = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err1) return resErr(err1)
    setTopoheight(topoheight)

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByTopoheight({
      start_topoheight: topoheight - 19,
      end_topoheight: topoheight
    }))
    if (err2) return resErr(err2)

    blocks.reverse()
    const txBlockMap = new Map()
    blocks.forEach(block => {
      block.txs_hashes.forEach(txId => {
        txBlockMap.set(txId, block)
      })
    })

    const recentExecuted = []
    for (let i = 0; i < txBlockMap.size; i += 20) {
      const txIds = Array.from(txBlockMap.keys())
      const [err3, txs] = await to(nodeSocket.daemon.getTransactions(txIds.slice(i, 20)))
      if (err3) return resErr(err3)

      txs.forEach((tx) => {
        if (!tx) return
        const block = txBlockMap.get(tx.hash)
        recentExecuted.push({ tx, block })
      })
    }

    setLoading(false)
    setExecutedTxs(recentExecuted)
  }, [nodeSocket])

  useNodeSocketSubscribe({
    event: RPCEvent.TransactionExecuted,
    onData: (_, data) => {
      // remove from mempool and add tx to data
      setMemPool((pool) => {
        let filteredPool = []
        pool.forEach(async tx => {
          if (tx.hash === data.tx_hash) {
            const [err, block] = await to(nodeSocket.daemon.getBlockAtTopoHeight({
              topoheight: data.topoheight
            }))
            if (err) return setErr(err)

            setExecutedTxs((executedTxs) => [{ tx, block }, ...executedTxs])
          } else {
            filteredPool.push(tx)
          }
        })

        return filteredPool
      })
    }
  }, [])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: async () => {
      // remove txs with blocks lower than the first tx block
      const [err, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
      if (err) return setErr(err)

      setTopoheight(topoheight)
      setExecutedTxs((items) => items.filter((item) => {
        return item.block.topoheight > topoheight - 20
      }))
    }
  }, [])

  useEffect(() => {
    loadExecutedTxs()
  }, [loadExecutedTxs])

  return <div>
    <h2>Executed Transactions ({executedTxs.length})</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Topo</th>
            <th>Hash</th>
            <th title="Transfers">T</th>
            <th>Signer</th>
            <th>Fees</th>
            <th>Age</th>
          </tr>
        </thead>
        <TableBody list={executedTxs} loading={loading} err={err} colSpan={6}
          emptyText="No transactions"
          onItem={(item) => {
            const { tx, block } = item
            const transfers = tx.data.transfers || []
            return <tr key={tx.hash}>
              <td>
                <Link to={`/blocks/${block.topoheight}`}>{block.topoheight}</Link>
                &nbsp;<span title="Number of blocks from topo height">({topoheight - block.topoheight})</span>
              </td>
              <td>
                <Link to={`/txs/${tx.hash}`}>{reduceText(tx.hash)}</Link>
              </td>
              <td>{transfers.length}</td>
              <td>
                <Link to={`/accounts/${tx.owner}`}>{reduceText(tx.owner, 0, 7)}</Link>
              </td>
              <td>{formatXelis(tx.fee)}</td>
              <td>
                <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
              </td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

export default MemPool