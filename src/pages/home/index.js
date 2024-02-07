import { useState, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import to from 'await-to-js'
import { useLang } from 'g45-react/hooks/useLang'

import { ExplorerSearch } from './explorer_search'
import { RecentBlocks } from './recent_blocks'
import { NetworkStats } from './network_stats'
import { RecentStats } from './recent_stats'
import { loadBlocks_SSR } from '../blocks'

export function useRecentBlocks() {
  const nodeSocket = useNodeSocket()

  const serverResult = loadBlocks_SSR({ pageState: { page: 1, size: 20 } })

  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const [blocks, setBlocks] = useState(serverResult.blocks)
  const [newBlock, setNewBlock] = useState()

  const loadRecentBlocks = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    setErr(null)
    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, topoheight] = await to(nodeSocket.daemon.methods.getTopoHeight())
    if (err1) return resErr(err1)

    const [err2, blocks] = await to(nodeSocket.daemon.methods.getBlocksRangeByTopoheight({
      start_topoheight: Math.max(0, topoheight - 19), // don't ask for lower than 0 - this is for the first 20 blocks of the blockchain
      end_topoheight: topoheight
    }))
    if (err2) return resErr(err2)
    setLoading(false)

    setBlocks(blocks.reverse())
  }, [nodeSocket.readyState])

  useEffect(() => {
    loadRecentBlocks()
  }, [loadRecentBlocks])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: (_, newBlock) => {
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })
      setNewBlock(newBlock)
    }
  }, [])

  useNodeSocketSubscribe({
    event: RPCEvent.BlockOrdered,
    onData: (_, data) => {
      const { topoheight, block_hash, block_type } = data
      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          block.topoheight = topoheight
          block.block_type = block_type
        }
        return block
      }))
    }
  }, [])

  useEffect(() => {
    if (blocks.length > 20) {
      blocks.pop()
      setBlocks([...blocks])
    }
  }, [blocks])

  return { err, loading, blocks, newBlock }
}

function Home() {
  const { blocks, newBlock } = useRecentBlocks()
  const { t } = useLang()

  return <div>
    <Helmet>
      <title>Home</title>
      <meta name="description" content={t('Dive into the XELIS Explorer. Navigate the blockchain, verify transactions, and access specific metadata.')} />
    </Helmet>
    <ExplorerSearch />
    <RecentBlocks blocks={blocks} newBlock={newBlock} />
    <RecentStats blocks={blocks} />
    <NetworkStats blocks={blocks} />
  </div>
}

export default Home
