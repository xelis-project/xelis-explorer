import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'

import useNodeRPC from '../../hooks/useNodeRPC'
import { formattedBlock } from '../../utils'
import NotFound from '../notFound'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import Transactions from './txs'
import { style as tableStyle } from '../../components/tableBody'
import theme from '../../theme'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    .description {
      display: flex;
      flex-direction: column;
      margin-bottom: 2em;
      gap: 1em;

      ${theme.query.desktop} {
        flex-direction: row;
        align-items: start;
        justify-content: space-between;
      }

      .buttons {
        display: flex;
        gap: 1em;

        a {
          border-radius: 30px;
          background-color: var(--text-color);
          color: var(--bg-color);
          padding: .5em 1em;
          display: flex;
          gap: .5em;
          align-items: center;
          text-wrap: nowrap;
          text-decoration: none;
        }
      }
    }
  `
}

function Block() {
  const { id } = useParams()

  const nodeRPC = useNodeRPC()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  let [block, setBlock] = useState({})
  const [topoheight, setTopoheight] = useState()

  const load = useCallback(async () => {
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
      setBlock(null)
    }

    if (/[a-z]/i.test(id)) {
      // by hash
      const [err, blockData] = await to(nodeRPC.getBlockByHash(id))
      if (err) return resErr(err)
      setBlock(blockData)
    } else {
      // by height
      const height = parseInt(id);
      const [err, blockData] = await to(nodeRPC.getBlockAtTopoHeight(height))
      if (err) return resErr(err)
      setBlock(blockData)
    }

    const [err, currentTopoheight] = await to(nodeRPC.getTopoHeight())
    if (err) return resErr(err)
    setTopoheight(currentTopoheight)

    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const formatBlock = useMemo(() => {
    if (Object.keys(block).length == 0) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  if (err) return <div>{err.message}</div>
  if (!loading && !block) return <NotFound />

  return <div className={style.container}>
    <PageLoading loading={loading} />
    <div>
      <Helmet>
        <title>Block {(block.topoheight || -1).toString()}</title>
      </Helmet>
      <h1>Block {block.topoheight}</h1>
      <div className="description">
        <div>
          This block was mined on {formatBlock.date} by {formatBlock.miner}.
          It currently has {formatBlock.confirmations} confirmations.
          The miner of this block earned {formatBlock.reward}.
        </div>
        <div className="buttons">
          <Button link={`/dag?height=${block.height}`} icon="layout-pin">DAG</Button>
          {formatBlock.hasPreviousBlock && <Button link={`/blocks/${block.topoheight - 1}`} icon="arrow-left">
            Previous Block
          </Button>}
          {formatBlock.hasNextBlock && <Button link={`/blocks/${block.topoheight + 1}`} icon="arrow-right" iconLocation="right">
            Next Block
          </Button>}
        </div>
      </div>
      <div className={tableStyle}>
        <table className="td-100">
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
              <td>
                {block.timestamp && <>
                  {formatBlock.date} ({block.timestamp})
                </>}
              </td>
            </tr>
            <tr>
              <th>Confirmations</th>
              <td>{formatBlock.confirmations || ''}</td>
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
              <td>{formatBlock.totalFees || ''}</td>
            </tr>
            <tr>
              <th>Reward</th>
              <td>{formatBlock.reward || ''}</td>
            </tr>
            <tr>
              <th>Txs</th>
              <td>{(block.txs_hashes || 0).length}</td>
            </tr>
            <tr>
              <th>Difficulty</th>
              <td>
                {block.difficulty && <>
                  <span>{block.difficulty} </span>
                  <span title="Cumulative Difficulty">
                    ({block.cumulative_difficulty})
                  </span>
                </>}
              </td>
            </tr>
            <tr>
              <th>Hash Rate</th>
              <td>
                {formatBlock.hashRate || ''}
              </td>
            </tr>
            <tr>
              <th>Size</th>
              <td>{formatBlock.size}</td>
            </tr>
            <tr>
              <th>Nonce</th>
              <td>
                {block.nonce && <>
                  <span>{block.nonce} </span>
                  <span title="Extra Nonce">({block.extra_nonce})</span>
                </>}
              </td>
            </tr>
            <tr>
              <th>Tips</th>
              <td style={{ lineHeight: `1.4em` }}>
                {(block.tips || []).map((tip, index) => {
                  return <div key={tip} style={{ wordBreak: `break-all` }}>
                    {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
                  </div>
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Transactions block={block} />
    </div>
  </div>
}

export default Block
