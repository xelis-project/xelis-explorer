import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import useNodeRPC from '../../hooks/useNodeRPC'
import { reduceText, shiftNumber } from '../../utils'
import NotFound from '../notFound'
import bytes from 'bytes'

import './card.css'

function Block() {
  const { id } = useParams()

  const nodeRPC = useNodeRPC()

  /*const block = {
    'timestamp': `10/10/2023`,
    'confirmations': 2,
    'miner': `xelis452305gi3450`,
    'reward': `1.5 XELIS`
  }*/

  const [loading, setLoading] = useState(true)
  const [block, setBlock] = useState()
  const [height, setHeight] = useState()

  const loadBlock = useCallback(async () => {
    const height = parseInt(id)
    const block = await nodeRPC.getBlockAtTopoHeight(height)
    setBlock(block)
  }, [id])

  const loadHeight = useCallback(async () => {
    const height = await nodeRPC.getHeight()
    setHeight(height)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    await loadBlock()
    await loadHeight()
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const formatBlock = useMemo(() => {
    if (!block) return {}

    return {
      date: new Date(block.timestamp).toLocaleString(),
      miner: reduceText(block.miner),
      reward: `${shiftNumber(block.reward, 5)} XELIS`,
      confirmations: height - block.height,
      size: bytes.format(block.total_size_in_bytes)
    }
  }, [block, height])

  if (loading) return null
  if (!block) return <NotFound />
  console.log(block)
  return <div>
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
            <th>Height</th>
            <td>{block.height}</td>
          </tr>
          <tr>
            <th>Topoheight</th>
            <td>{block.topoheight}</td>
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
