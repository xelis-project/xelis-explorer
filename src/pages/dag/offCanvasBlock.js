import { useState, useCallback, useMemo } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useLang } from 'g45-react/hooks/useLang'

import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { formattedBlock } from '../../utils'
import OffCanvas from '../../components/offCanvas'
import Button from '../../components/button'
import { getBlockType } from './index'

const style = {
  container: css`
    overflow-y: auto;

    table td {
      word-break: break-all;
    }

    > :nth-child(1) {
      padding: 1em;
      gap: 1em;
      display: flex;

      button {
        border: none;
        border-radius: 30px;
        padding: .5em 1em;
        background-color: var(--text-color);
        color: var(--bg-color);
        cursor: pointer;
        display: flex;
        gap: .5em;
        align-items: center;
        font-size: .9em;
      }
    }

    > :nth-child(2) {
      padding: 1em;
      background-color: var(--bg-color);
      
      > div {
        margin-bottom: 1.5em;

        > :nth-child(1) {
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: .5em;
        }

        > :nth-child(2) {
          font-size: 1em;
          word-break: break-all;
          color: var(--muted-color);
        }
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
  const [err, setErr] = useState()
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const open = useCallback((block) => {
    setBlock(block)
    setOpened(true)
  }, [])

  const formatBlock = useMemo(() => {
    if (!block) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  const loadBlock = useCallback(async (topoheight) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, data] = await to(nodeSocket.daemon.getBlockAtTopoHeight({
      topoheight: topoheight
    }))
    if (err) return setErr(err)
    setBlock(data)
  }, [nodeSocket.readyState])

  const render = <OffCanvas position="left" maxWidth={500} opened={opened} className={style.container}>
    {block && <>
      <div>
        <Button onClick={() => setOpened(false)} icon="close" />
        {formatBlock.hasPreviousBlock && <Button onClick={() => loadBlock(block.topoheight - 1)} icon="arrow-left">
          {t('Previous Block')}
        </Button>}
        {formatBlock.hasNextBlock && <Button onClick={() => loadBlock(block.topoheight + 1)} icon="arrow-right" iconLocation="right">
          {t('Next Block')}
        </Button>}
      </div>
      <div>
        <div>
          <div>{t('Hash')}</div>
          <div>
            <Link to={`/blocks/${block.hash}`}>{block.hash}</Link>
          </div>
        </div>
        <div>
          <div>{t('Block Type')}</div>
          <div>{getBlockType(block, stableHeight)}</div>
        </div>
        <div>
          <div>{t('Timestamp')}</div>
          <div>{formatBlock.date} ({(block.timestamp || 0).toLocaleString()})</div>
        </div>
        <div>
          <div>{t('Confirmations')}</div>
          <div>{(formatBlock.confirmations || 0).toLocaleString()}</div>
        </div>
        <div>
          <div>{t('Topo Height')}</div>
          <div>{(block.topoheight || 0).toLocaleString()}</div>
        </div>
        <div>
          <div>{t('Height')}</div>
          <div>{(block.height || 0).toLocaleString()}</div>
        </div>
        <div>
          <div>{t('Miner')}</div>
          <div>
            <Link to={`/accounts/${block.miner}`}>{block.miner}</Link>
          </div>
        </div>
        <div>
          <div>{t('Reward')}</div>
          <div>{formatBlock.reward}</div>
        </div>
        <div>
          <div>{t('Txs')}</div>
          <div>{(block.txs_hashes || []).length.toLocaleString()}</div>
        </div>
        <div>
          <div>{t('Difficulty')}</div>
          <div>
            <span>{block.difficulty.toLocaleString()} </span>
            <span title="Cumulative Difficulty">
              ({block.cumulative_difficulty.toLocaleString()})
            </span>
          </div>
        </div>
        <div>
          <div>{t('Hash Rate')}</div>
          <div>{formatBlock.hashRate}</div>
        </div>
        <div>
          <div>{t('Size')}</div>
          <div>{formatBlock.size}</div>
        </div>
        <div>
          <div>{t('Nonce')}</div>
          <div>
            <span>{block.nonce.toLocaleString()} </span>
            <span title="Extra Nonce">({block.extra_nonce})</span>
          </div>
        </div>
        <div>
          <div>{t('Tips')}</div>
          <div>
            {block.tips.map((tip, index) => {
              return <div key={tip}>
                {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
              </div>
            })}
          </div>
        </div>
      </div>
    </>}
  </OffCanvas>

  return { render, open }
}

export default useOffCanvasBlock