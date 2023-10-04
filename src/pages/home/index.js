import { useState, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/context'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import to from 'await-to-js'

import { ExplorerSearch } from './explorer_search'
import { RecentBlocks } from './recent_blocks'
import { NetworkStats } from './network_stats'
import { RecentStats } from './recent_stats'
import { loadBlocks_SSR } from '../blocks'

function useRecentBlocks() {
  const nodeSocket = useNodeSocket()

  const serverResult = loadBlocks_SSR({ limit: 20, defaultBlocks: [{}, {}, {}, {}, {}, {}, {}, {}, {}] })

  const [loading, setLoading] = useState()
  const [err, setErr] = useState()
  const [blocks, setBlocks] = useState(serverResult.blocks)

  const loadRecentBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return

    setLoading(true)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    const [err1, topoheight] = await to(nodeSocket.daemon.getTopoHeight())
    if (err1) return resErr(err1)

    const [err2, blocks] = await to(nodeSocket.daemon.getBlocksRangeByTopoheight({
      start_topoheight: topoheight - 19,
      end_topoheight: topoheight
    }))
    if (err2) return resErr(err2)
    setLoading(false)

    setBlocks(blocks.reverse())
  }, [nodeSocket])

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
      //setAnimateBlock(newBlock.hash)
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

  return { err, loading, blocks }
}

function Home() {
  const { blocks } = useRecentBlocks()

  return <div>
    <Helmet>
      <title>Home</title>
    </Helmet>
    <ExplorerSearch />
    <RecentBlocks blocks={blocks} />
    <RecentStats blocks={blocks} />
    <NetworkStats blocks={blocks} />
  </div>
}

export default Home
