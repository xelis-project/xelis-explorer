import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { useNodeSocket } from '@xelis/sdk/react/context'
import { css } from 'goober'

import TableBody, { style as tableStyle } from '../../components/tableBody'
import { formatXelis, formatAsset, formatAssetName, reduceText, displayError, formatSize } from '../../utils'
import PageLoading from '../../components/pageLoading'
import TableFlex from '../../components/tableFlex'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    h2 {
      margin: 1em 0 .5em 0;
      font-weight: bold;
      font-size: 1.5em;
    }

    .error {
      padding: 1em;
      color: white;
      font-weight: bold;
      background-color: var(--error-color);
    }
  `
}

function Transaction() {
  const { hash } = useParams()

  const nodeSocket = useNodeSocket()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [tx, setTx] = useState({})

  const loadTx = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, data] = await to(nodeSocket.daemon.getTransaction(hash))
    if (err) return resErr(err)

    setTx(data)
    setLoading(false)
  }, [hash, nodeSocket])

  useEffect(() => {
    loadTx()
  }, [loadTx])

  let transfers = []
  if (tx.data && tx.data.transfers) transfers = tx.data.transfers

  let burns = []
  if (tx.data && tx.data.burn) burns = [tx.data.burn]

  return <div className={style.container}>
    <PageLoading loading={loading} />
    <Helmet>
      <title>Transaction {tx.hash || ''}</title>
    </Helmet>
    <h1>Transaction {reduceText(tx.hash, 4, 4)}</h1>
    {err && <div className="error">{displayError(err)}</div>}
    <div>
      <TableFlex 
        headers={[
          {
            key: 'hash',
            title: 'Hash',
          },
          {
            key: 'owner',
            title: 'Signer',
          },
          {
            key: 'in_mempool',
            title: 'In Mempool',
            render: (value) => {
              if (value === true) return `Yes`
              if (value === false) return `No`
              return ``
            }
          },
          {
            key: 'signature',
            title: 'Signature',
          },
          {
            key: 'fee',
            title: 'Fee',
            render: (value) => value && formatXelis(value)
          },
          {
            key: 'nonce',
            title: 'Nonce',
          },
          {
            key: 'executed_in_block',
            title: 'Executed In',
            render: (value) => {
              return <Link to={`/blocks/${value}`}>{reduceText(value)}</Link>
            }
          },
        ]}
        data={[tx]}
        rowKey="hash"
      />
      <Transfers transfers={transfers} />
      <Burns burns={burns} />
      <InBlocks tx={tx} />
      <h2>Extra</h2>
      <div>
        {!tx.extra_data && <div>No extra data</div>}
        {tx.extra_data && JSON.stringify(tx.extra_data, null, 2)}
      </div>
    </div>
  </div>
}

function Transfers(props) {
  const { transfers } = props
  return <div>
    <h2>Transfers</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Amount</th>
            <th>Recipient</th>
          </tr>
        </thead>
        <TableBody list={transfers} emptyText="No transfers" colSpan={3}
          onItem={(item, index) => {
            const { amount, asset, to } = item
            return <tr key={index}>
              <td>{formatAssetName(asset)}</td>
              <td>{formatAsset(amount, asset)}</td>
              <td>{to}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

function Burns(props) {
  const { burns } = props
  return <div>
    <h2>Burns</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Amount</th>
          </tr>
        </thead>
        <TableBody list={burns} emptyText="No burns" colSpan={2}
          onItem={(item, index) => {
            const { amount, asset } = item
            return <tr key={index}>
              <td>{formatAssetName(asset)}</td>
              <td>{formatAsset(amount, asset)}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

function InBlocks(props) {
  const { tx } = props

  const nodeSocket = useNodeSocket()
  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [blocks, setBlocks] = useState([])

  const loadTxBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoading(true)
    setErr(null)

    const resErr = () => {
      setLoading(false)
      setErr(err)
    }

    const blocks = []
    for (let i = 0; i < (tx.blocks || []).length; i++) {
      const hash = tx.blocks[i]
      const [err, data] = await to(nodeSocket.daemon.getBlockByHash(hash))
      if (err) return resErr(err)
      blocks.push(data)
    }

    setLoading(false)
    setBlocks(blocks)
  }, [tx, nodeSocket])

  useEffect(() => {
    loadTxBlocks()
  }, [loadTxBlocks])

  return <div>
    <h2>In Blocks</h2>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Topoheight</th>
            <th>Hash</th>
            <th>Type</th>
            <th>Size</th>
            <th>Fees</th>
            <th>Timestamp</th>
            <th>Txs</th>
          </tr>
        </thead>
        <TableBody list={blocks} loading={loading} err={err} emptyText="No blocks" colSpan={7}
          onItem={(item, index) => {
            const size = formatSize(item.total_size_in_bytes)
            const time = new Date(item.timestamp).toLocaleString()
            return <tr key={item.hash}>
              <td><Link to={`/blocks/${item.topoheight}`}>{item.topoheight}</Link></td>
              <td><Link to={`/blocks/${item.hash}`}>{reduceText(item.hash)}</Link></td>
              <td>{item.block_type}</td>
              <td>{size}</td>
              <td>{formatXelis(item.total_fees)}</td>
              <td>{time}</td>
              <td>{item.txs_hashes.length}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

export default Transaction
