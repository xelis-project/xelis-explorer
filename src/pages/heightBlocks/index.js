import { css } from 'goober'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import to from 'await-to-js'

import { daemonRPC } from '../../hooks/nodeRPC'
import PageTitle from '../../layout/page_title'
import { useLang } from 'g45-react/hooks/useLang'
import { formatSize, formatXelis, reduceText } from '../../utils'
import { getBlockColor } from '../dag/blockColor'
import useTheme from '../../hooks/useTheme'
import Hashicon from '../../components/hashicon'
import NotFound from '../notFound'

const style = {
  container: css`
    .list {
      display: flex;
      flex-direction: column;
      gap: 1em;

      > div {
        display: flex;
        gap: 2em;
        padding: 1em;
        border-radius: 1em;
        justify-content: space-between;
        align-items: center;
        background-color: var(--stats-bg-color);
        overflow: auto;
        white-space: nowrap;

        > div {
          > :nth-child(1) {
            color: var(--muted-color);
            margin-bottom: .5em;
          }
  
          > :nth-child(2) {
            font-size: 1.2em;
          }
        }

        .view_block {
          background-color: #00000030;
          padding: .5em;
          border-radius: .5em;
          text-decoration: none;
        }
      }
    }
  `,
  miner: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
}

function loadHeightBlocks_SSR({ height }) {
  const defaultResult = { loaded: false, err: null, blocks: [] }
  return useServerData(`func:loadHeightBlocks(${height})`, async () => {
    const result = Object.assign({}, defaultResult)

    const [err1, res1] = await to(daemonRPC.getBlocksAtHeight({ height: parseInt(height) }))
    result.err = err1 ? err1.message : null
    if (err1) return result

    result.blocks = res1.result
    result.loaded = true
    return result
  }, defaultResult)
}

function HeightBlocks() {
  const { height } = useParams()
  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const nodeSocket = useNodeSocket()
  const serverResult = loadHeightBlocks_SSR({ height })
  const [blocks, setBlocks] = useState(serverResult.blocks)
  const { firstPageLoad } = usePageLoad()
  const { t } = useLang()
  const { theme: currentTheme } = useTheme()

  const loadBlocks = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setErr(err)
      setLoading(false)
    }

    const [err, blocks] = await to(nodeSocket.daemon.methods.getBlocksAtHeight({ height: parseInt(height) }))
    if (err) return resErr(err)

    setBlocks(blocks)
  }, [nodeSocket, height])

  useEffect(() => {
    if (firstPageLoad && serverResult.loaded) return
    if (serverResult.err) return
    loadBlocks()
  }, [loadBlocks, firstPageLoad])

  if (!loading && blocks.length === 0) {
    return <NotFound />
  }

  return <div className={style.container}>
    <PageTitle title={t('Height {}', [parseInt(height).toLocaleString()])}
      subtitle={t(`List of blocks at this height`)}
      metaDescription={t(`List of blocks at height {}`, [height.toLocaleString()])}
    />
    <div className="list">
      {blocks.map((block) => {

        const txCount = (block.txs_hashes || []).length
        const color = getBlockColor(currentTheme, block.block_type)

        return <div key={block.hash}>
          <div>
            <div>{t(`Hash`)}</div>
            <div>
              <Link to={`/blocks/${block.hash}`}>
                {reduceText(block.hash)}
              </Link>
            </div>
          </div>
          <div>
            <div>{t(`Topo`)}</div>
            <div>{block.topoheight != null ? block.topoheight.toLocaleString() : `--`}</div>
          </div>
          <div>
            <div>{t(`Type`)}</div>
            <div style={{ color }}>{block.block_type}</div>
          </div>
          <div>
            <div>{t(`Txs`)}</div>
            <div>{txCount}</div>
          </div>
          <div>
            <div>{t(`Size`)}</div>
            <div>{formatSize(block.total_size_in_bytes)}</div>
          </div>
          <div>
            <div>{t(`Reward`)}</div>
            <div>{formatXelis(block.miner_reward)}</div>
          </div>
          <div>
            <div>{t(`Miner`)}</div>
            <div className={style.miner}>
              <Hashicon value={block.miner} size={20} />
              <Link to={`/accounts/${block.miner}`}>{reduceText(block.miner, 0, 7)}</Link>
            </div>
          </div>
          <Link className="view_block" to={`/blocks/${block.topoheight}`}>
            {t(`View block`)}
          </Link>
        </div>
      })}
    </div>
  </div>
}

export default HeightBlocks
