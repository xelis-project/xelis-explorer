import { useState, useCallback, useMemo } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'

import useNodeRPC from '../../hooks/useNodeRPC'
import { formattedBlock } from '../../utils'
import OffCanvas from '../../components/offCanvas'
import Button from '../../components/button'
import { style as tableStyle } from '../../components/tableBody'
import { getBlockType } from './index'

const style = {
  container: css`
    overflow-y: auto;

    table td {
      word-break: break-all;
    }

    .buttons {
      padding: 1em;
      gap: 1em;
      display: flex;

      button {
        border: none;
        border-radius: 15px;
        padding: .5em 1em;
        background-color: var(--text-color);
        color: var(--bg-color);
        cursor: pointer;
        display: flex;
        gap: .5em;
        align-items: center;
      }
    }
  `
}

function useOffCanvasBlock(props) {
  const { info } = props

  const topoheight = info.topoheight
  const stableHeight = info.stableHeight
  const [block, setBlock] = useState()
  const [opened, setOpened] = useState(false)
  const nodeRPC = useNodeRPC()

  const open = useCallback((block) => {
    setBlock(block)
    setOpened(true)
  }, [])

  const formatBlock = useMemo(() => {
    if (!block) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  const loadBlock = useCallback(async (topoheight) => {
    const [err, blockData] = await to(nodeRPC.getBlockAtTopoHeight(topoheight))
    if (err) return resErr(err)
    setBlock(blockData)
  }, [])

  const render = <OffCanvas position="left" maxWidth={500} opened={opened} className={style.container}>
    {block && <div>
      <div className="buttons">
        <Button onClick={() => setOpened(false)} icon="close" />
        {formatBlock.hasPreviousBlock && <Button onClick={() => loadBlock(block.topoheight - 1)} icon="arrow-left">
          Previous Block ({block.topoheight - 1})
        </Button>}
        {formatBlock.hasNextBlock && <Button onClick={() => loadBlock(block.topoheight + 1)} icon="arrow-right" iconLocation="right">
          Next Block ({block.topoheight + 1})
        </Button>}
      </div>
      <div className={tableStyle}>
        <table>
          <tbody>
            <tr>
              <th>Block Type</th>
            </tr>
            <tr>
              <td>{getBlockType(block, stableHeight)}</td>
            </tr>
            <tr>
              <th>Hash</th>
            </tr>
            <tr>
              <td>
                <Link to={`/blocks/${block.hash}`}>{block.hash}</Link>
              </td>
            </tr>
            <tr>
              <th>Timestamp</th>
            </tr>
            <tr>
              <td>{formatBlock.date} ({block.timestamp.toLocaleString()})</td>
            </tr>
            <tr>
              <th>Confirmations</th>
            </tr>
            <tr>
              <td>{formatBlock.confirmations.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Topo Height</th>
            </tr>
            <tr>
              <td>{block.topoheight.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Height</th>
            </tr>
            <tr>
              <td>{block.height.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Miner</th>
            </tr>
            <tr>
              <td>{block.miner}</td>
            </tr>
            <tr>
              <th>Reward</th>
            </tr>
            <tr>
              <td>{formatBlock.reward}</td>
            </tr>
            <tr>
              <th>Txs</th>
            </tr>
            <tr>
              <td>{block.txs_hashes.length.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Difficulty</th>
            </tr>
            <tr>
              <td>
                <span>{block.difficulty.toLocaleString()} </span>
                <span title="Cumulative Difficulty">
                  ({block.cumulative_difficulty.toLocaleString()})
                </span>
              </td>
            </tr>
            <tr>
              <th>Hash Rate</th>
            </tr>
            <tr>
              <td>
                {formatBlock.hashRate}
              </td>
            </tr>
            <tr>
              <th>Size</th>
            </tr>
            <tr>
              <td>{formatBlock.size}</td>
            </tr>
            <tr>
              <th>Nonce</th>
            </tr>
            <tr>
              <td>
                <span>{block.nonce.toLocaleString()} </span>
                <span title="Extra Nonce">({block.extra_nonce})</span>
              </td>
            </tr>
            <tr>
              <th>Tips</th>
            </tr>
            <tr>
              <td>
                {block.tips.map((tip, index) => {
                  return <div key={tip}>
                    {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
                  </div>
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>}
  </OffCanvas>

  return { render, open }
}

export default useOffCanvasBlock