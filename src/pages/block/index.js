import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import useNodeRPC from '../../hooks/useNodeRPC'
import { formatXelis, reduceText } from '../../utils'
import NotFound from '../notFound'
import bytes from 'bytes'
import { Helmet } from 'react-helmet'
import to from 'await-to-js'

import './card.css'

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

    const topoheight = parseInt(id)
    const [err1, block] = await to(nodeRPC.getBlockAtTopoHeight(topoheight))
    if (err1) return resErr(err1)

    const [err2, topTopoHeight] = await to(nodeRPC.getTopoHeight())
    if (err2) return resErr(err2)

    setTopoheight(topTopoHeight)
    setBlock(block)

    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const formatBlock = useMemo(() => {
    if (!block) return {}

    return {
      date: new Date(block.timestamp).toLocaleString(),
      miner: reduceText(block.miner),
      reward: formatXelis(block.reward),
      confirmations: topoheight - block.topoheight,
      size: bytes.format(block.total_size_in_bytes)
    }
  }, [block, topoheight])

  if (loading) return null
  if (err) return <div>{err.message}</div>
  if (!block) return <NotFound />

  return <div>
    <Helmet>
      <title>Block {id}</title>
    </Helmet>
    <h1>Block {id}</h1>
    <div className="card">
      This block was mined on {formatBlock.date} by {formatBlock.miner}. It currently has {formatBlock.confirmations} confirmations.
      The miner of this block earned {formatBlock.reward}.
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
            <th>Fees</th>
            <td>{block.total_fees}</td>
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
    <h2>Transactions</h2>
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>No transactions</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
}

export default Block
