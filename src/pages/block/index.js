import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import useNodeRPC from '../../hooks/useNodeRPC'
import { formatAsset, formatXelis, reduceText } from '../../utils'
import NotFound from '../notFound'
import bytes from 'bytes'
import { Helmet } from 'react-helmet'
import to from 'await-to-js'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import { Link } from 'react-router-dom'
import TableBody from '../../components/tableBody'
import Pagination, { getPaginationRange } from '../../components/pagination'
import DotLoading from '../../components/dotLoading'

function Block() {
  const { id } = useParams()

  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [block, setBlock] = useState()
  const [topoheight, setTopoheight] = useState()

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const height = parseInt(id)
    const [err1, blockData] = await to(nodeRPC.getBlockAtTopoHeight(height))
    if (err1) return resErr(err1)

    const [err2, currentTopoheight] = await to(nodeRPC.getTopoHeight())
    if (err2) return resErr(err2)

    setTopoheight(currentTopoheight)
    setBlock(blockData)

    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const formatBlock = useMemo(() => {
    let _topoheight = topoheight || 0
    if (!block) return {}
    return {
      date: new Date(block.timestamp).toLocaleString(),
      miner: reduceText(block.miner),
      totalFees: formatXelis(block.total_fees),
      reward: formatXelis(block.reward),
      confirmations: _topoheight - block.topoheight,
      size: bytes.format(block.total_size_in_bytes),
      hasPreviousBlock: block.topoheight > 0,
      hasNextBlock: block.topoheight < _topoheight
    }
  }, [block, topoheight])

  if (err) return <div>{err.message}</div>
  if (!block && loading) return <div>Loading<DotLoading /></div>
  if (!loading && !block) return <NotFound />
  if (!block) return null

  return <div>
    <PageLoading loading={loading} />
    <div>
      <Helmet>
        <title>Block {id}</title>
      </Helmet>
      <h1>Block {id}</h1>
      <div className="card">
        This block was mined on {formatBlock.date} by {formatBlock.miner}. It currently has {formatBlock.confirmations} confirmations.
        The miner of this block earned {formatBlock.reward}.
      </div>
      <div className="left-right-buttons">
        {formatBlock.hasPreviousBlock && <Button link={`/blocks/${block.topoheight - 1}`} icon="chevron-left-r">
          Previous Block ({block.topoheight - 1})
        </Button>}
        {formatBlock.hasNextBlock && <Button link={`/blocks/${block.topoheight + 1}`} icon="chevron-right-r" iconLocation="right">
          Next Block ({block.topoheight + 1})
        </Button>}
      </div>
      <div className="table-responsive">
        <table>
          <tbody>
            <tr>
              <th>Block Type</th>
              <td>{block.block_type}</td>
            </tr>
            <tr>
              <th>Hash</th>
              <td>{block.hash}</td>
            </tr>
            <tr>
              <th>Timestamp</th>
              <td>{formatBlock.date} ({block.timestamp})</td>
            </tr>
            <tr>
              <th>Confirmations</th>
              <td>{formatBlock.confirmations}</td>
            </tr>
            <tr>
              <th>Topoheight</th>
              <td>{block.topoheight}</td>
            </tr>
            <tr>
              <th>Height</th>
              <td>{block.height}</td>
            </tr>
            <tr>
              <th>Miner</th>
              <td>{block.miner}</td>
            </tr>
            <tr>
              <th>Total Fees</th>
              <td>{formatBlock.totalFees}</td>
            </tr>
            <tr>
              <th>Reward</th>
              <td>{formatBlock.reward}</td>
            </tr>
            <tr>
              <th>Txs</th>
              <td>{block.txs_hashes.length}</td>
            </tr>
            <tr>
              <th>Difficulty</th>
              <td>{block.difficulty}</td>
            </tr>
            <tr>
              <th>Size</th>
              <td>{formatBlock.size}</td>
            </tr>
            <tr>
              <th>Nonce</th>
              <td>{block.nonce} ({block.extra_nonce})</td>
            </tr>
            <tr>
              <th>Tips</th>
              <td>{JSON.stringify(block.tips)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Transactions block={block} />
    </div>
  </div>
}

function Transactions(props) {
  const { block } = props

  const nodeRPC = useNodeRPC()

  const count = useMemo(() => {
    return block.txs_hashes.length
  }, [block])

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [transactions, setTransactions] = useState([])
  const [pageState, setPageState] = useState({ page: 1, size: 5 })

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const { start, end } = getPaginationRange(pageState)
    const txHashes = block.txs_hashes.slice(start, end + 1)
    const [err, txs] = await to(nodeRPC.getTransactions(txHashes))
    if (err) return resErr(err)

    setTransactions(txs)
    setLoading(false)
  }, [block, pageState])

  useEffect(() => {
    if (block) load()
  }, [block, load])

  return <div>
    <h2>Transactions</h2>
    <Pagination state={pageState} setState={setPageState}
      countText="txs" count={count} style={{ marginBottom: `1em` }} />
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Transfers</th>
            <th>Signer</th>
            <th>Fees</th>
          </tr>
        </thead>
        <TableBody list={transactions} loading={loading} err={err} emptyText="No transactions" colSpan={5}
          onItem={(item) => {
            return <React.Fragment key={item.hash}>
              <tr>
                <td><Link to={`/txs/${item.hash}`}>{item.hash}</Link></td>
                <td>{item.data.Transfer.length}</td>
                <td>{reduceText(item.owner)}</td>
                <td>{formatXelis(item.fee)}</td>
              </tr>
              <tr>
                <td colSpan={4}>
                  {item.data.Transfer.map((transfer, index) => {
                    return <div key={index}>
                      {index + 1}. Sent {formatAsset(transfer.amount, transfer.asset)} to {transfer.to}
                    </div>
                  })}
                </td>
              </tr>
            </React.Fragment>
          }}
        />
      </table>
    </div>
    <Pagination state={pageState} setState={setPageState}
      countText="txs" count={count} style={{ marginTop: `.5em` }} />
  </div>
}

export default Block
