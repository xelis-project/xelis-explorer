import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import prettyMs from 'pretty-ms'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'

import Table from '../../components/table'
import { formatXelis, reduceText } from '../../utils'
import Chart from '../../components/chart'
import { useRecentBlocks } from '../../pages/home'
import useTheme from '../../hooks/useTheme'
import PageTitle from '../../layout/page_title'
import Hashicon from '../../components/hashicon'
import { formatAddr } from '../../utils/known_addrs'

import style from './style'

function MemPool() {
  const [memPool, setMemPool] = useState([])
  const [topoheight, setTopoheight] = useState()
  const [loading, setLoading] = useState(true)
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

    const [err1, topoheight] = await to(nodeSocket.daemon.methods.getTopoheight())
    if (err1) return resErr(err2)
    setTopoheight(topoheight)

    const [err2, data] = await to(nodeSocket.daemon.methods.getMemPool())
    if (err2) return resErr(err2)
    setMemPool(data.transactions)
    setLoading(false)
  }, [nodeSocket.readyState])

  useEffect(() => {
    loadMemPool()
  }, [loadMemPool])

  useNodeSocketSubscribe({
    event: RPCEvent.TransactionAddedInMempool,
    onData: (_, data) => {
      setMemPool((pool) => [data, ...pool])
    }
  }, [])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: async () => {
      const [err, topoheight] = await to(nodeSocket.daemon.methods.getTopoheight())
      if (err) return console.log(err)
      setTopoheight(topoheight)
    }
  }, [])

  const filteredMempool = useMemo(() => {
    if (!filterTx) return memPool
    return memPool.filter((tx) => {
      if (tx.hash.indexOf(filterTx) !== -1) return true
      if (tx.source.indexOf(filterTx) !== -1) return true
      return false
    })
  }, [memPool, filterTx])

  return <div>
    <PageTitle title={t('Mempool')} subtitle={t('Past, pending and executed transactions.')}
      metaDescription={t('View pending transactions and network congestion. Verify if your transaction was executed.')} />
    <div>
      <TxsHistoryChart />
      <input className={style.searchInput} type="text"
        placeholder={t('Type your account address or transaction hash to filter the list below.')}
        onChange={(e) => setFilterTx(e.target.value)} />
      <div className={style.tables}>
        <PendingTxs memPool={filteredMempool} err={err} loading={loading} />
        <ExecutedTxs filterTx={filterTx} setMemPool={setMemPool} topoheight={topoheight} />
      </div>
      <OrphanedTxs setMemPool={setMemPool} topoheight={topoheight} />
    </div>
  </div>
}

function TxsHistoryChart(props) {
  const { blocks } = useRecentBlocks()
  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  const chartRef = useRef()

  const totalTxs = useMemo(() => {
    return blocks.reduce((t, block) => t + (block.txs_hashes || []).length, 0)
  }, [blocks])

  const data = useMemo(() => {
    const lastBlocks = Object.assign([], blocks).reverse()
    const labels = lastBlocks.map((block) => {
      return block.timestamp
    })

    const data = lastBlocks.map((block) => {
      return (block.txs_hashes || []).length
    })

    return {
      labels,
      datasets: [{
        label: 'Txs',
        data,
        backgroundColor: `transparent`,
        borderWidth: 4,
        tension: .3,
        pointRadius: 0,
        borderColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
      }]
    }
  }, [blocks, currentTheme])

  const options = useMemo(() => {
    const formatTimestamp = (timestamp) => {
      try {
        const age = Date.now() - timestamp
        return prettyMs(parseInt(age), { secondsDecimalDigits: 0 })
      } catch {
        // timestamp could be NaN or not a number
        // use try catch and avoid trow "Expected a finite number" by prettyMs()
        return 0
      }
    }

    return {
      animation: false,
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
          grid: {
            display: false,
          },
          beginAtZero: true,
          ticks: {
            color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
            precision: 0
          }
        },
        x: {
          grid: {
            display: false,
          },
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
  }, [currentTheme])

  useEffect(() => {
    const intervalId = setInterval(() => {
      // update callback ticks to display elapsed time every second
      chartRef.current.update()
    }, 1000)
    return () => {
      return clearInterval(intervalId)
    }
  }, [])

  return <div className={style.chart}>
    <div>{t('Last 100 blocks ({} txs)', [totalTxs])}</div>
    <Chart ref={chartRef} type="line" data={data} options={options} />
  </div>
}

function PendingTxs(props) {
  const { memPool, loading, err } = props

  const { t } = useLang()

  return <div>
    <h2 className={style.title}>{t('Pending Transactions ({})', [memPool.length.toLocaleString()])}</h2>
    <Table
      headers={[t(`Hash`), t(`Signer`), t(`Fees`), t(`Age`)]}
      list={memPool} loading={loading} err={err} colSpan={4} emptyText={t('No transactions')}
      onItem={(item) => {
        return <tr key={item.hash}>
          <td title={item.hash}>
            <Link to={`/txs/${item.hash}`}>{reduceText(item.hash)}</Link>
          </td>
          <td>
            <div className={style.addr}>
              <Hashicon value={item.source} size={20} />
              <Link to={`/accounts/${item.source}`}>
                {formatAddr(item.source)}
              </Link>
            </div>
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
  const { filterTx, setMemPool, topoheight } = props

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState()
  const [txs, setTxs] = useState([])
  const nodeSocket = useNodeSocket()
  const loadedRef = useRef(false)
  const { t } = useLang()

  const loadTxs = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    if (loadedRef.current) return
    if (!topoheight) return

    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, blocks] = await to(nodeSocket.daemon.methods.getBlocksRangeByTopoheight({
      start_topoheight: Math.max(0, topoheight - 19),
      end_topoheight: topoheight
    }))
    if (err1) return resErr(err1)

    blocks.reverse()
    const txBlockMap = new Map()
    blocks.forEach(block => {
      (block.txs_hashes || []).forEach(txId => {
        txBlockMap.set(txId, block)
      })
    })

    const txList = []
    for (let i = 0; i < txBlockMap.size; i += 20) {
      const txIds = Array.from(txBlockMap.keys())
      const [err3, txs] = await to(nodeSocket.daemon.methods.getTransactions(txIds.slice(i, 20)))
      if (err3) return resErr(err3)

      txs.forEach((tx) => {
        if (!tx) return
        const block = txBlockMap.get(tx.hash)
        txList.push({ tx, block })
      })
    }

    setLoading(false)
    setTxs(txList)
    loadedRef.current = true
  }, [nodeSocket.readyState, topoheight])

  useNodeSocketSubscribe({
    event: RPCEvent.TransactionExecuted,
    onData: (_, data) => {
      // remove from mempool and add tx to data
      setMemPool((pool) => {
        let newPool = []
        pool.forEach(async tx => {
          if (tx.hash === data.tx_hash) {
            const [err, block] = await to(nodeSocket.daemon.methods.getBlockAtTopoheight({
              topoheight: data.topoheight
            }))
            if (err) return setErr(err)

            tx.executed_in_block = data.block_hash
            setTxs((txs) => [{ tx, block }, ...txs])
          } else {
            newPool.push(tx)
          }
        })

        return newPool
      })
    }
  }, [])

  useEffect(() => {
    // remove txs with blocks lower than the first tx block
    setTxs((items) => items.filter((item) => {
      return item.block.topoheight > topoheight - 20
    }))
  }, [topoheight])

  useEffect(() => {
    loadTxs()
  }, [loadTxs])

  const filteredTxs = useMemo(() => {
    if (!filterTx) return txs
    return txs.filter(({ tx }) => {
      if (tx.hash.indexOf(filterTx) !== -1) return true
      if (tx.source.indexOf(filterTx) !== -1) return true
      return false
    })
  }, [txs, filterTx])

  return <div>
    <h2 className={style.title}>{t('Executed Transactions ({})', [filteredTxs.length.toLocaleString()])}</h2>
    <Table
      headers={[t(`Topo Height`), t(`Hash`), t(`Signer`), t(`Fees`), t(`Age`)]}
      list={filteredTxs} loading={loading} err={err} colSpan={5}
      emptyText={t('No transactions')}
      onItem={(item) => {
        const { tx, block } = item
        const blockCount = topoheight - block.topoheight
        return <tr key={tx.hash}>
          <td>
            <Link to={`/blocks/${block.topoheight}`}>
              {block.topoheight.toLocaleString()}
            </Link>
            &nbsp;<span title={`${blockCount} block${blockCount > 1 ? `s` : ``} ago`}>({blockCount})</span>
          </td>
          <td>
            <Link to={`/txs/${tx.hash}`}>{reduceText(tx.hash)}</Link>
          </td>
          <td>
            <div className={style.addr}>
              <Hashicon value={tx.source} size={20} />
              <Link to={`/accounts/${tx.source}`}>{formatAddr(tx.source, 0, 7)}</Link>
            </div>
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

function OrphanedTxs(props) {
  const { setMemPool, topoheight } = props

  const [txs, setTxs] = useState([])
  const [err, setErr] = useState()
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  useNodeSocketSubscribe({
    event: RPCEvent.TransactionOrphaned,
    onData: async (_, data) => {
      setMemPool((pool) => {
        let newPool = []
        pool.forEach(async tx => {
          if (tx.hash === data.hash) {
            const [err, block] = await to(nodeSocket.daemon.methods.getBlockAtTopoheight({
              topoheight: tx.reference.topoheight
            }))
            if (err) return setErr(err)

            setTxs((txs) => [{ tx, block }, ...txs])
          } else {
            newPool.push(tx)
          }
        })

        return newPool
      })
    }
  }, [])

  useEffect(() => {
    setTxs((items) => items.filter((item) => {
      return item.block.topoheight > topoheight - 20
    }))
  }, [topoheight])

  return <div>
    <h2 className={style.title}>{t('Orphaned Transactions ({})', [txs.length.toLocaleString()])}</h2>
    <Table
      headers={[t(`Topo Ref`), t(`Hash`), , t(`Signer`), t(`Nonce`), t(`Age`)]}
      list={txs} loading={false} err={err} colSpan={5}
      emptyText={t('No transactions')}
      onItem={(item) => {
        const { tx, block } = item
        const blockCount = topoheight - block.topoheight
        return <tr key={tx.hash}>
          <td>
            <Link to={`/blocks/${block.topoheight}`}>
              {block.topoheight.toLocaleString()}
            </Link>
            &nbsp;<span title={`${blockCount} block${blockCount > 1 ? `s` : ``} ago`}>({blockCount})</span>
          </td>
          <td>
            <Link to={`/txs/${tx.hash}`}>{reduceText(tx.hash)}</Link>
          </td>
          <td>
            <div className={style.addr}>
              <Hashicon value={tx.source} size={20} />
              <Link to={`/accounts/${tx.source}`}>{formatAddr(tx.source, 0, 7)}</Link>
            </div>
          </td>
          <td>{tx.nonce}</td>
          <td>
            <Age timestamp={block.timestamp} update format={{ secondsDecimalDigits: 0 }} />
          </td>
        </tr>
      }}
    />
  </div>
}

export default MemPool