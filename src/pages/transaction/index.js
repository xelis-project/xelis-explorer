import { useCallback, useEffect, useState } from 'react'
import useNodeRPC from '../../hooks/useNodeRPC'
import { useParams } from 'react-router'
import { Helmet } from 'react-helmet'
import NotFound from '../notFound'
import to from 'await-to-js'
import TableBody from '../../components/tableBody'
import { formatXelis, formatAsset, formatAssetName, reduceText } from '../../utils'
import { Link } from 'react-router-dom'
import bytes from 'bytes'

function Transaction() {
  const { hash } = useParams()

  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [tx, setTx] = useState()
  const [blocks, setBlocks] = useState([])

  const loadTx = useCallback(async () => {
    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    setLoading(true)
    const [err, data] = await to(nodeRPC.getTransaction(hash))
    if (err) return resErr(err)

    setTx(data)
    setLoading(false)
  }, [hash])

  const loadTxBlocks = useCallback(async () => {
    if (!tx) return

    const blocks = []
    for (let i = 0; i < tx.blocks.length; i++) {
      const hash = tx.blocks[i]
      const [err, data] = await to(nodeRPC.getBlockByHash(hash))
      if (err) return console.log(err)
      blocks.push(data)
    }

    console.log(blocks)
    setBlocks(blocks)
  }, [tx])

  useEffect(() => {
    loadTx()
  }, [loadTx])


  useEffect(() => {
    loadTxBlocks()
  }, [loadTxBlocks])

  if (loading) return null
  if (!loading && !tx) return <NotFound />

  const transfers = tx.data.Transfer

  return <div>
    <Helmet>
      <title>Transaction {hash}</title>
    </Helmet>
    <h1>Transaction {reduceText(hash, 4, 4)}</h1>
    <div>
      <div className="table-responsive">
        <table>
          <tbody>
            <tr>
              <th>Hash</th>
              <td>{hash}</td>
            </tr>
            <tr>
              <th>Signer</th>
              <td>{tx.owner}</td>
            </tr>
            <tr>
              <th>Signature</th>
              <td>{tx.signature}</td>
            </tr>
            <tr>
              <th>Fees</th>
              <td>{formatXelis(tx.fee)}</td>
            </tr>
            <tr>
              <th>Nonce</th>
              <td>{tx.nonce}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Transfers transfers={transfers} />
      <Blocks blocks={blocks} />
      <h2>Extra Data</h2>
      <div>
        {!tx.extra_data && `No extra data`}
        {tx.extra_data && JSON.stringify(tx.extra_data, null, 2)}
      </div>
    </div>
  </div>
}

function Transfers(props) {
  const { transfers } = props
  return <div>
    <h2>Transfers</h2>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Amount</th>
            <th>Recipient</th>
          </tr>
        </thead>
        <TableBody list={transfers} emptyText="No transfers"
          onItem={(item, index) => {
            return <tr key={index}>
              <td>{formatAssetName(item.asset)}</td>
              <td>{formatAsset(item.amount, item.asset)}</td>
              <td>{item.to}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

function Blocks(props) {
  const { blocks } = props

  return <div>
    <h2>Blocks</h2>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Topoheight</th>
            <th>Type</th>
            <th>Size</th>
            <th>Total Fees</th>
            <th>Timestamp</th>
            <th>Txs</th>
          </tr>
        </thead>
        <TableBody list={blocks} emptyText="No blocks" colSpan={6}
          onItem={(item, index) => {
            const size = bytes.format(item.total_size_in_bytes)
            const time = new Date(item.timestamp).toLocaleString()
            return <tr key={item.hash}>
              <td><Link to={`/blocks/${item.topoheight}`}>{item.topoheight}</Link></td>
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
