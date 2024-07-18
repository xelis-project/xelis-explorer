import { useState, useCallback, useMemo } from 'react'
import to from 'await-to-js'
import { Link } from 'react-router-dom'
import { css } from 'goober'
import { useLang } from 'g45-react/hooks/useLang'

import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { formatBlock, formatXelis, formatDifficulty } from '../../utils'
import OffCanvas from '../../components/offCanvas'
import Button from '../../components/button'
import { getBlockType } from './index'
import { getBlockColor } from './blockColor'
import useTheme from '../../hooks/useTheme'

const style = {
  container: css`
    overflow-y: auto;
  `,
  actionButtons: css`
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
      transition: .1s all;

      &:hover {
        transform: scale(.98);
      }
    }
  `,
  items: css`
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
        font-size: 1.2em;
        word-break: break-all;
        color: var(--muted-color);
      }
    }
  `
}

function useOffCanvasBlock(props) {
  const { info, blocks } = props

  const topoheight = info.topoheight
  const stableHeight = info.stableheight
  const [block, setBlock] = useState()
  const [opened, setOpened] = useState(false)
  const [err, setErr] = useState()
  const nodeSocket = useNodeSocket()
  const { t } = useLang()
  const { theme: currentTheme } = useTheme()

  const open = useCallback((block) => {
    setBlock(block)
    setOpened(true)
  }, [])

  const formattedBlock = useMemo(() => {
    if (!block) return {}
    return formatBlock(block, topoheight || 0)
  }, [block, topoheight])

  const loadBlock = useCallback(async (topoheight) => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, data] = await to(nodeSocket.daemon.methods.getBlockAtTopoHeight({
      topoheight: topoheight
    }))
    if (err) return setErr(err)
    setBlock(data)
  }, [nodeSocket.readyState])

  const blockType = block ? getBlockType(blocks, block, stableHeight) : `?`

  const render = <OffCanvas position="left" maxWidth={500} opened={opened} className={style.container}>
    {block && <>
      <div className={style.actionButtons}>
        <Button onClick={() => setOpened(false)} icon="close" />
        {formattedBlock.hasPreviousBlock && <Button onClick={() => loadBlock(block.topoheight - 1)} icon="arrow-left">
          {t('Previous Block')}
        </Button>}
        {formattedBlock.hasNextBlock && <Button onClick={() => loadBlock(block.topoheight + 1)} icon="arrow-right" iconLocation="right">
          {t('Next Block')}
        </Button>}
      </div>
      <div className={style.items}>
        <div>
          <div>{t('Hash')}</div>
          <div>
            <Link to={`/blocks/${block.hash}`}>{block.hash}</Link>
          </div>
        </div>
        <div>
          <div>{t('Block Type')}</div>
          <div style={{ color: getBlockColor(currentTheme, blockType) }}>{blockType}</div>
        </div>
        <div>
          <div>{t('Timestamp')}</div>
          <div title={block.timestamp || 0}>{formattedBlock.date}</div>
        </div>
        <div>
          <div>{t('Confirmations')}</div>
          <div>{(formattedBlock.confirmations || 0).toLocaleString()}</div>
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
          <div>{t('Fees')}</div>
          <div>
            {formatXelis(block.total_fees)}
          </div>
        </div>
        <div>
          <div>{t('Reward')}</div>
          <div>{formattedBlock.reward}</div>
        </div>
        <div>
          <div>{t('Supply')}</div>
          <div>
            {formatXelis(block.supply)}
          </div>
        </div>
        <div>
          <div>{t('Txs')}</div>
          <div>{(block.txs_hashes || []).length.toLocaleString()}</div>
        </div>
        <div>
          <div>{t('Difficulty')}</div>
          <div title={block.difficulty.toLocaleString()}>
            {formatDifficulty(block.difficulty).toLocaleString()}
          </div>
        </div>
        <div>
          <div>{t('Cumulative Difficulty')}</div>
          <div title={block.cumulative_difficulty.toLocaleString()}>
            {formatDifficulty(block.cumulative_difficulty).toLocaleString()}
          </div>
        </div>
        <div>
          <div>{t('Hash Rate')}</div>
          <div>{formattedBlock.hashRate}</div>
        </div>
        <div>
          <div>{t('Size')}</div>
          <div>{formattedBlock.size}</div>
        </div>
        <div>
          <div>{t('Nonce')}</div>
          <div>
            {block.nonce.toLocaleString()}
          </div>
        </div>
        <div>
          <div>{t('Extra Nonce')}</div>
          <div>
            {block.extra_nonce}
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