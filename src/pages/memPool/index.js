import { Link } from 'react-router-dom'
import to from 'await-to-js'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import prettyMs from 'pretty-ms'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'

import Table from '../../components/table'
import { formatXelis, reduceText } from '../../utils'
import Chart from '../../components/chart'
import theme from '../../style/theme'
import { useRecentBlocks } from '../../pages/home'
import useTheme from '../../hooks/useTheme'
import PageTitle from '../../layout/page_title'
import Hashicon from '../../components/hashicon'

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
        background-color: var(--stats-bg-color);
        padding: 1em;
        border-radius: .5em;
        display: flex;
        gap: 1em;
        flex-direction: column;

        canvas {
          max-height: 10em;
        }
      }
    }

    > div > :nth-child(3) {
      display: flex;
      gap: 1em;
      flex-direction: column;
      justify-content: space-between;
      gap: 1em;

      ${theme.query.minLarge} {
        flex-direction: row;
      }

      > div {
        flex: 1;
        
        > div {
          max-height: 30em;
        }
      }
    }
  `,
  account: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
}

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

    const [err1, topoheight] = await to(nodeSocket.daemon.methods.getTopoHeight())
    if (err1) return resErr(err2)
    setTopoheight(topoheight)

    const [err2, data] = await to(nodeSocket.daemon.methods.getMemPool())
    if (err2) return resErr(err2)
    setMemPool(data)
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
      const [err, topoheight] = await to(nodeSocket.daemon.methods.getTopoHeight())
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
        backgroundColor: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        fill: true,
        borderWidth: 4,
        tension: .3,
        pointRadius: 2,
        borderColor: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
      }]
    }
  }, [blocks, currentTheme])

  const options = useMemo(() => {
    const formatTimestamp = (timestamp) => {
      return prettyMs(new Date().getTime() - timestamp, { secondsDecimalDigits: 0 })
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
          beginAtZero: true,
          ticks: {
            color: currentTheme === 'light' ? `#1c1c1c` : `#f1f1f1`,
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
  }, [])

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
    <div>{t('Last 20 blocks ({} txs)', [totalTxs])}</div>
    <Chart ref={chartRef} type="line" data={data} options={options} />
  </div>
}

function PendingTxs(props) {
  const { memPool, loading, err } = props

  const { t } = useLang()

  return <div>
    <h2>{t('Pending Transactions ({})', [memPool.length.toLocaleString()])}</h2>
    <Table
      headers={[t(`Hash`), t(`Signer`), t(`Fees`), t(`Age`)]}
      list={memPool} loading={loading} err={err} colSpan={4} emptyText={t('No transactions')}
      onItem={(item) => {
        return <tr key={item.hash}>
          <td title={item.hash}>
            <Link to={`/txs/${item.hash}`}>{reduceText(item.hash)}</Link>
          </td>
          <td>
            <div className={style.account}>
              <Hashicon value={item.source} size={20} />
              <Link to={`/accounts/${item.source}`}>{reduceText(item.source, 0, 7)}</Link>
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
            const [err, block] = await to(nodeSocket.daemon.methods.getBlockAtTopoHeight({
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
    <h2>{t('Executed Transactions ({})', [filteredTxs.length.toLocaleString()])}</h2>
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
            <div className={style.account}>
              <Hashicon value={tx.source} size={20} />
              <Link to={`/accounts/${tx.source}`}>{reduceText(tx.source, 0, 7)}</Link>
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
            const [err, block] = await to(nodeSocket.daemon.methods.getBlockAtTopoHeight({
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
    <h2>{t('Orphaned Transactions ({})', [txs.length.toLocaleString()])}</h2>
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
            <div className={style.account}>
              <Hashicon value={tx.source} size={20} />
              <Link to={`/accounts/${tx.source}`}>{reduceText(tx.source, 0, 7)}</Link>
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