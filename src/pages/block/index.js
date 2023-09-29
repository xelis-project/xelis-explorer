import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/context'

import { displayError, formatHashRate, formatSize, formatXelis, formattedBlock } from '../../utils'
import NotFound from '../notFound'
import PageLoading from '../../components/pageLoading'
import Button from '../../components/button'
import Transactions from './txs'
import theme from '../../style/theme'
import { scaleOnHover } from '../../style/animate'
import TableFlex from '../../components/tableFlex'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 .5em 0;
      font-weight: bold;
      font-size: 2em;
    }

    .error {
      padding: 1em;
      color: white;
      font-weight: bold;
      background-color: var(--error-color);
    }

    .controls {
      display: flex;
      flex-direction: column;
      margin-bottom: 2em;
      gap: 1em;

      ${theme.query.minDesktop} {
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
          ${scaleOnHover}

          ${theme.query.maxDesktop} {
            > div {
              display: none;
            }
          }
        }
      }
    }
  `
}

function Block() {
  const { id } = useParams()

  const nodeSocket = useNodeSocket()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState(true)
  const [block, setBlock] = useState({})
  const [topoheight, setTopoheight] = useState()

  const load = useCallback(async () => {
    if (!nodeSocket.connected) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    if (/[a-z]/i.test(id)) {
      // by hash
      const [err, blockData] = await to(nodeSocket.daemon.getBlockByHash(id))
      if (err) return resErr(err)
      setBlock(blockData)
    } else {
      // by height
      const height = parseInt(id);
      const [err, blockData] = await to(nodeSocket.daemon.getBlockAtTopoHeight(height))
      if (err) return resErr(err)
      setBlock(blockData)
    }

    const [err, currentTopoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err) return resErr(err)
    setTopoheight(currentTopoheight)

    setLoading(false)
  }, [id, nodeSocket])

  useEffect(() => {
    load()
  }, [load])

  const formatBlock = useMemo(() => {
    if (!block) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  return <div className={style.container}>
    <PageLoading loading={loading} />
    <div>
      <Helmet>
        <title>Block {(block.topoheight || -1).toString()}</title>
      </Helmet>
      <h1>Block {block.topoheight}</h1>
      {err && <div className="error">{displayError(err)}</div>}
      {!err && <div className="controls">
        <div>
          {!loading && <>
            This block was mined on {formatBlock.date} by {formatBlock.miner}.
            It currently has {formatBlock.confirmations} confirmations.
            The miner of this block earned {formatBlock.reward}.
          </>}
        </div>
        <div className="buttons">
          <Button link={`/dag?height=${block.height}`} icon="layout-pin">DAG</Button>
          {formatBlock.hasPreviousBlock && <Button link={`/blocks/${block.topoheight - 1}`} icon="arrow-left">
            <div>Previous Block</div>
          </Button>}
          {formatBlock.hasNextBlock && <Button link={`/blocks/${block.topoheight + 1}`} icon="arrow-right" iconLocation="right">
            <div> Next Block</div>
          </Button>}
        </div>
      </div>}
      <TableFlex
        rowKey="hash"
        headers={[
          {
            key: 'hash',
            title: 'Hash',
          },
          {
            key: 'block_type',
            title: 'Block type',
          },
          {
            key: 'timestamp',
            title: 'Timestamp',
            render: (value) => value && `${formatBlock.date} (${block.timestamp})`
          },
          {
            key: 'confirmations',
            title: 'Confirmations',
            render: (value, item) => {
              if (formatBlock.confirmations >= 0) return formatBlock.confirmations
              return ``
            }
          },
          {
            key: 'topoheight',
            title: 'Topoheight',
          },
          {
            key: 'height',
            title: 'Height',
          },
          {
            key: 'miner',
            title: 'Miner',
          },
          {
            key: 'total_fees',
            title: 'Fees',
            render: (value, item) => {
              // total_fees can be undefined even if block is valid - use hash to check instead
              if (item.hash) return formatXelis(value || 0)
              return ``
            }
          },
          {
            key: 'reward',
            title: 'Reward',
            render: (value) => value && formatXelis(value)
          },
          {
            key: 'txs_hashes',
            title: 'Txs',
            render: (value) => value ? value.length : ``
          },
          {
            key: 'difficulty',
            title: 'Difficulty',
            render: (value, item) => value && <>
              <span>{value} </span>
              <span title="Cumulative Difficulty">
                ({item.cumulative_difficulty})
              </span>
            </>,
          },
          {
            key: 'hash_rate',
            title: 'Hash Rate',
            render: (value, item) => item.difficulty && formatHashRate(item.difficulty / 15)
          },
          {
            key: 'total_size_in_bytes',
            title: 'Size',
            render: (value) => formatSize(value)
          },
          {
            key: 'tips',
            title: 'Tips',
            render: (value) => <>
              {(value || []).map((tip, index) => {
                return <div key={tip}>
                  {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
                </div>
              })}
            </>
          },
        ]}
        data={[block]}
      />
      <Transactions block={block} />
    </div>
  </div>
}

export default Block
