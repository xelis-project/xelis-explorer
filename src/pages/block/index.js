import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import useNodeRPC from '../../hooks/useNodeRPC'
import { formatXelis, reduceText } from '../../utils'
import NotFound from '../notFound'
import bytes from 'bytes'
import { Helmet } from 'react-helmet'
import to from 'await-to-js'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import { Link } from 'react-router-dom'
import TableBody from '../../components/tableBody'

import './card.css'

const emptyBlock = {
  block_type: ``,
  hash: ``,
  timestamp: 0,
  confirmations: 0,
  topoheight: 0,
  height: 0,
  miner: ``,
  total_fees: 0,
  reward: 0,
  difficulty: 0,
  cumulative_difficulty: 0,
  total_size_in_bytes: 0,
  nonce: 0,
  extra_nonce: ``,
  txs_hashes: []
}

function Transactions(props) {
  const { block } = props

  const nodeRPC = useNodeRPC()

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState()
  const [transactions, setTransactions] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const [err, txs] = await to(nodeRPC.getTransactions(block.txs_hashes))
    if (err) return console.log(err)

    setTransactions(txs)
    setLoading(false)
  }, [block])

  useEffect(() => {
    if (block) load()
  }, [block, load])

  return <div>
    <h2>Transactions</h2>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Hash</th>
            <th>Signer</th>
            <th>Fees</th>
          </tr>
        </thead>
        <TableBody list={transactions} loading={loading} err={err} emptyText="No transactions" colSpan={5}
          onItem={(item, index) => {
            const hash = block.txs_hashes[index]
            console.log(hash)
            return <tr key={hash}>
              <td><Link to={`/txs/${hash}`}>{hash}</Link></td>
              <td>{reduceText(item.owner)}</td>
              <td>{item.fee}</td>
            </tr>
          }}
        />
      </table>
    </div>
  </div>
}

function Block() {
  const { id } = useParams()

  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [block, setBlock] = useState()
  const [topoheight, setTopoheight] = useState()

  const load = useCallback(async () => {
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
          </tbody>
        </table>
      </div>
      <Transactions block={block} />
    </div>
  </div>
}

export default Block
