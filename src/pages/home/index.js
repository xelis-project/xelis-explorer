import { useState, useCallback, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import useNodeSocket, { useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import to from 'await-to-js'
import { useLang } from 'g45-react/hooks/useLang'
import { useServerData } from 'g45-react/hooks/useServerData'

import { ExplorerSearch } from './explorer_search'
import { RecentBlocks } from './recent_blocks'
import { NetworkStats } from './network_stats'
import { RecentStats } from './recent_stats'
import { loadBlocks_SSR } from '../blocks'
import { daemonRPC } from '../../node_rpc'

const BLOCK_ITERATIONS = 5

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

    let blocks = []

    for (let i = 0; i < BLOCK_ITERATIONS; i++) {
      const x = i * 20

      const [err2, bls] = await to(nodeSocket.daemon.methods.getBlocksRangeByTopoheight({
        start_topoheight: Math.max(0, topoheight - x - 19), // don't ask for lower than 0 - this is for the first 20 blocks of the blockchain
        end_topoheight: topoheight - x
      }))
      if (err2) return resErr(err2)
  
      blocks = blocks.concat(bls.reverse())
    }
    setLoading(false)
    setBlocks(blocks)
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
    if (blocks.length > 20*BLOCK_ITERATIONS) {
      blocks.pop()
      setBlocks([...blocks])
    }
  }, [blocks])

  return { err, loading, blocks, newBlock }
}

function loadNetworkInfo_SSR() {
  const defaultResult = { err: null, info: {}, loaded: false }
  return useServerData(`func:loadNetworkStats`, async () => {
    const result = Object.assign({}, defaultResult)
    const [err, res1] = await to(daemonRPC.getInfo())
    result.err = err ? err.message : null
    if (err) return

    result.loaded = true
    result.info = res1.result
    return result
  }, defaultResult)
}

export function useNetworkInfo() {
  const nodeSocket = useNodeSocket()
  const serverResult = loadNetworkInfo_SSR()

  const [err, setErr] = useState()
  const [loading, setLoading] = useState()
  const [info, setInfo] = useState(serverResult.info)

  const loadInfo = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const resErr = (err) => {
      setInfo({})
      setErr(err)
      setLoading(false)
    }

    setLoading(true)
    const [err, info] = await to(nodeSocket.daemon.methods.getInfo())
    if (err) return resErr(err)
    setInfo(info)
    setLoading(false)
  }, [nodeSocket.readyState])

  useEffect(() => {
    loadInfo()
  }, [loadInfo])

  return { err, loading, info, loadInfo }
}

function Home() {
  const { blocks, newBlock } = useRecentBlocks()
  const { t } = useLang()

  const { info, loadInfo } = useNetworkInfo()

  useEffect(() => {
    loadInfo()
  }, [blocks])

  return <div>
    <Helmet>
      <title>Home</title>
      <meta name="description" content={t('Dive into the XELIS Explorer. Navigate the blockchain, verify transactions, and access specific metadata.')} />
    </Helmet>
    <ExplorerSearch />
    <RecentBlocks blocks={blocks} newBlock={newBlock} />
    <RecentStats blocks={blocks} info={info} />
    <NetworkStats blocks={blocks} info={info} />
  </div>
}

export default Home
