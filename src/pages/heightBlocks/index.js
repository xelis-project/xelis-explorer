import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useNodeSocket } from '@xelis/sdk/react/daemon'
import { usePageLoad } from 'g45-react/hooks/usePageLoad'
import { useServerData } from 'g45-react/hooks/useServerData'
import to from 'await-to-js'
import { useLang } from 'g45-react/hooks/useLang'
import Icon from 'g45-react/components/fontawesome_icon'

import { daemonRPC } from '../../node_rpc'
import PageTitle from '../../layout/page_title'
import { formatSize, formatXelis, reduceText } from '../../utils'
import { formatMiner } from '../../utils/pools'
import { getBlockColor } from '../dag/blockColor'
import useTheme from '../../hooks/useTheme'
import Hashicon from '../../components/hashicon'
import NotFound from '../notFound'

import style from './style'

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

  return <div>
    <PageTitle title={t('Height {}', [parseInt(height).toLocaleString()])}
      subtitle={t(`List of blocks at this height.`)}
      metaDescription={t(`List of blocks at height {}.`, [height.toLocaleString()])}
    />
    <div className={style.list}>
      {blocks.map((block) => {

        const txCount = (block.txs_hashes || []).length
        const color = getBlockColor(currentTheme, block.block_type)

        return <div key={block.hash} className={style.item.container}>
          <div>
            <div className={style.item.title}>{t(`Hash`)}</div>
            <div className={style.item.value}>
              <Link to={`/blocks/${block.hash}`}>
                {reduceText(block.hash)}
              </Link>
            </div>
          </div>
          <div>
            <div className={style.item.title}>{t(`Topo`)}</div>
            <div className={style.item.value}>{block.topoheight != null ? block.topoheight.toLocaleString() : `--`}</div>
          </div>
          <div>
            <div className={style.item.title}>{t(`Type`)}</div>
            <div style={{ color }} className={style.item.value}>{block.block_type}</div>
          </div>
          <div>
            <div className={style.item.title}>{t(`Txs`)}</div>
            <div className={style.item.value}>{txCount}</div>
          </div>
          <div>
            <div className={style.item.title}>{t(`Size`)}</div>
            <div className={style.item.value}>{formatSize(block.total_size_in_bytes)}</div>
          </div>
          <div>
            <div className={style.item.title}>{t(`Reward`)}</div>
            <div className={style.item.value}>{formatXelis(block.miner_reward)}</div>
          </div>
          <div>
            <div className={style.item.title}>{t(`Miner`)}</div>
            <div className={`${style.miner} ${style.item.value}`}>
              <Hashicon value={block.miner} size={20} />
              <Link to={`/accounts/${block.miner}`}>{formatMiner(block.miner)}</Link>
            </div>
          </div>
          <Link className={style.item.button} to={`/blocks/${block.topoheight}`}>
            <Icon name="cube" />
            {t(`View block`)}
          </Link>
        </div>
      })}
    </div>
  </div>
}

export default HeightBlocks
