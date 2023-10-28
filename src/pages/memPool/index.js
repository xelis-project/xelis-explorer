import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import prettyMs from 'pretty-ms'
import Age from 'g45-react/components/age'

import Table from '../../components/table'
import { formatXelis, reduceText } from '../../utils'
import Chart from '../../components/chart'
import theme from '../../style/theme'
import { useRecentBlocks } from '../../pages/home'
import useTheme from '../../hooks/useTheme'
import PageTitle from '../../layout/page_title'
import { useLang } from 'g45-react/hooks/useLang'

const style = {
  container: css`
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

    > :nth-child(2) {
      > :nth-child(1) {
        margin-bottom: 2em;
      }
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
  const { t } = useLang()

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

  const filteredMempool = useMemo(() => {
    if (!filterTx) return memPool
    return memPool.filter((tx) => {
      if (tx.hash.indexOf(filterTx) !== -1) return true
      if (tx.owner.indexOf(filterTx) !== -1) return true
      return false
    })
  }, [memPool, filterTx])

  return <div className={style.container}>
    <PageTitle title={t('Mempool')} subtitle={t('Past, pending and executed transactions.')}
      metaDescription={t('View pending transactions and network congestion. Verify if your transaction was executed.')} />
    <div>
      <TxsHistoryChart />
      <input type="text" placeholder={t('Type your account address or transaction hash to filter the list below.')} onChange={(e) => {
        setFilterTx(e.target.value)
      }} />
      <div>
        <PendingTxs memPool={filteredMempool} err={err} loading={loading} />
        <ExecutedTxs filterTx={filterTx} setMemPool={setMemPool} />
      </div>
    </div>
  </div>
}

function TxsHistoryChart(props) {
  const { blocks } = useRecentBlocks()
  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  const totalTxs = useMemo(() => {
    return blocks.reduce((t, block) => t + block.txs_hashes.length, 0)
  }, [blocks])

  const chartRef = useRef()

  const chartConfig = useMemo(() => {
    const lastBlocks = Object.assign([], blocks).reverse()
    const labels = lastBlocks.map((block) => {
      return block.timestamp
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

    const formatTimestamp = (timestamp) => {
      return prettyMs(new Date().getTime() - timestamp, { secondsDecimalDigits: 0 })
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
          tooltip: {
            callbacks: {
              title: function (context) {
                const timestamp = context[0].label
                return formatTimestamp(timestamp)
              }
            }
          }
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
              color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
              callback: function (value, index, ticks) {
                const timestamp = this.getLabelForValue(value)
                return formatTimestamp(timestamp)
              }
            }
          }
        }
      }
    }
  }, [blocks, currentTheme])

  useEffect(() => {
    const intervalId = setInterval(() => {
      // update callback ticks to display elapsed time every second
      chartRef.current.update()
    }, 1000)
    return () => {
      return clearInterval(intervalId)
    }
  }, [])

  return <div>
    <h2>{t('Last 20 blocks ({} txs)', [totalTxs])}</h2>
    <Chart chartRef={chartRef} config={chartConfig} />
  </div>
}

function PendingTxs(props) {
  const { memPool, loading, err } = props

  const { t } = useLang()

  return <div>
    <h2>{t('Pending Transactions ({})', [memPool.length])}</h2>
    <Table
      headers={[t(`Hash`), t(`Signer`), t(`Fees`), t(`Age`)]}
      list={memPool} loading={loading} err={err} colSpan={4} emptyText="No transactions"
      onItem={(item) => {
        return <tr key={item.hash}>
          <td title={item.hash}>
            <Link to={`/txs/${item.hash}`}>{reduceText(item.hash)}</Link>
          </td>
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
  </div>
}

function ExecutedTxs(props) {
  const { filterTx, setMemPool } = props

  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const [executedTxs, setExecutedTxs] = useState([])
  const nodeSocket = useNodeSocket()
  const [topoheight, setTopoheight] = useState()
  const { t } = useLang()

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

  const filteredExecutedTxs = useMemo(() => {
    if (!filterTx) return executedTxs
    return executedTxs.filter(({ tx }) => {
      if (tx.hash.indexOf(filterTx) !== -1) return true
      if (tx.owner.indexOf(filterTx) !== -1) return true
      return false
    })
  }, [executedTxs, filterTx])

  return <div>
    <h2>{t('Executed Transactions ({})', [executedTxs.length])}</h2>
    <Table
      headers={[t(`Topo`), t(`Hash`), t(`Signer`), t(`Fees`), t(`Age`)]}
      list={filteredExecutedTxs} loading={loading} err={err} colSpan={5}
      emptyText={t('No transactions')}
      onItem={(item) => {
        const { tx, block } = item
        const blockCount = topoheight - block.topoheight
        return <tr key={tx.hash}>
          <td>
            <Link to={`/blocks/${block.topoheight}`}>{block.topoheight}</Link>
            &nbsp;<span title={`${blockCount} block${blockCount > 1 ? `s` : ``} ago`}>({blockCount})</span>
          </td>
          <td>
            <Link to={`/txs/${tx.hash}`}>{reduceText(tx.hash)}</Link>
          </td>
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
  </div>
}

export default MemPool