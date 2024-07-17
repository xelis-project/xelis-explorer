import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Text, Segment, Segments, Instance, Instances, MapControls } from '@react-three/drei'
import { MeshBasicMaterial, Vector3 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent, BlockType } from '@xelis/sdk/daemon/types'
import TWEEN from '@tweenjs/tween.js'
import Age from 'g45-react/components/age'
import { useLang } from 'g45-react/hooks/useLang'

import { groupBy } from '../../utils'
import Button from '../../components/button'
import NodeStatus from '../../layout/node_status'
import useOffCanvasTable from './offCanvasTable'
import useOffCanvasBlock from './offCanvasBlock'
import { getBlockColor } from './blockColor'
import useTheme from '../../hooks/useTheme'
import BottomInfo from './bottomInfo'
import theme from '../../style/theme'

const style = {
  canvas: css`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    overflow: hidden;
    background-color: var(--bg-color);
    opacity: 1;
    --bg-line-color: ${theme.apply({ xelis: '#21423d', dark: '#191919', light: '#efefef' })};
    background-image:  linear-gradient(var(--bg-line-color) 1px, transparent 1px), linear-gradient(to right, var(--bg-line-color) 1px, var(--bg-color) 1px);
    background-size: 20px 20px;
  `,
  controls: css`
    position: fixed;
    right: 0;
    padding: 1em;
    display: flex;
    gap: 1em;
    flex-direction: column;
    align-items: center;
    top: 0;

    button, a {
      background-color: var(--text-color);
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: block;
      height: 50px;
      width: 50px;
      font-size: 1.2em;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bg-color);
      transition: .1s all;

      &:hover {
        transform: scale(.9);
      }
    }
  `,
  status: css`
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 2.5em;
  `
}

export function getBlockType(block, stableHeight, heightBlocks) {
  // block is Sync when he is alone at a stable height
  let totalBlocksAtHeight = 0

  for (let i = 0; i < heightBlocks.length; i++) {
    const [height, blocks] = heightBlocks[i]
    if (height === block.height) {
      totalBlocksAtHeight = blocks.length
      break
    }
  }

  if (
    totalBlocksAtHeight <= 1 &&
    block.block_type === BlockType.Normal &&
    block.height <= stableHeight
  ) {
    return BlockType.Sync
  }

  return block.block_type
}

function InstancedLines(props) {
  const { blocks = [], hoveredBlock, offCanvasTable } = props

  const [lineWidth, setLineWidth] = useState(1)
  // scale line width based on camera zoom
  useFrame(({ camera }) => {
    let newLineWidth = 30 * (camera.zoom / 1000)
    setLineWidth(newLineWidth)
  })

  const unhoveredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (hoveredBlock) return b.data.hash !== hoveredBlock.data.hash
      return true
    })
  }, [blocks, hoveredBlock])

  const unhoveredCount = useMemo(() => {
    return unhoveredBlocks.reduce((t, b) => t + b.data.tips.length, 0)
  }, [unhoveredBlocks])

  const hoveredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (hoveredBlock) return b.data.hash === hoveredBlock.data.hash
      return false
    })
  }, [blocks, hoveredBlock])

  const hoveredCount = useMemo(() => {
    return hoveredBlocks.reduce((t, b) => t + b.data.tips.length, 0)
  }, [hoveredBlocks])


  // make sure key is count or won't unmount - https://github.com/pmndrs/drei/issues/923
  return <>
    {!offCanvasTable.hideLines && <Segments key={`lines-${unhoveredCount}`} limit={5000} lineWidth={lineWidth} transparent opacity={0.3}>
      {unhoveredBlocks.map((block) => {
        let { data, x, y } = block
        return data.tips.map((tip) => {
          const blockTip = blocks.find((b) => b.data.hash === tip)
          if (!blockTip) return null

          const key = data.hash + tip
          const z = 0
          return <Segment key={key} start={[blockTip.x, blockTip.y, z]} end={[x, y, z]} />
        })
      })}
    </Segments>}
    <Segments key={`hover-lines-${hoveredCount}`} lineWidth={lineWidth} transparent>
      {hoveredBlocks.map((block) => {
        let { data, x, y } = block
        return data.tips.map((tip) => {
          const blockTip = blocks.find((b) => b.data.hash === tip)
          if (!blockTip) return null

          const key = data.hash + tip
          const z = 1
          return <Segment key={key} start={[blockTip.x, blockTip.y, z]} end={[x, y, z]} />
        })
      })}
    </Segments>
  </>
}

function InstancedBlocks(props) {
  const { blocks = [], newBlock, hoveredBlock, setHoveredBlock, offCanvasBlock, stableHeight, setCursor, heightBlocks } = props

  const { theme: currentTheme } = useTheme()
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1), [])
  const material = useMemo(() => new MeshBasicMaterial(), [])
  /*useFrame(({ gl }) => {
    console.log(gl.info.render.calls)
  })*/
  const [pointerDown, setPointerDown] = useState(false)

  // avoid block over if pointer is already down (moving screen)
  useEffect(() => {
    const onPointerDown = () => {
      setPointerDown(true)
    }

    const onPointerUp = () => {
      setPointerDown(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  /*const textStyle = useMemo(() => {
    return {
      userSelect: 'none',
      color: 'black',
      fontWeight: 'bold',
      textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
    }
  }, [])*/

  const onPointerEnter = useCallback((block, e) => {
    if (pointerDown) return
    if (e.object.name === 'hash') return

    setHoveredBlock(block)
    setCursor('pointer')
  }, [pointerDown])

  const onPointerLeave = useCallback((e) => {
    if (pointerDown) return
    if (e.object.name === 'topoheight') return
    if (e.object.name === 'hash') return

    setHoveredBlock(null)
    setCursor('grab')
  }, [pointerDown])

  const onClick = useCallback((block) => {
    offCanvasBlock.open(block.data)
  }, [offCanvasBlock])


  const [scale, setScale] = useState({})
  useEffect(() => {
    if (!newBlock) return

    const animateBlock = async () => {
      const hash = newBlock.hash
      let values = { x: 2 }
      new TWEEN.Tween(values).to({ x: 1 }, 1000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(() => {
          setScale((scale) => {
            scale[hash] = values.x
            return { ...scale }
          })
        })
        .onComplete(() => {
          setScale((scale) => {
            Reflect.deleteProperty(scale, hash)
            return { ...scale }
          })
        }).start()
    }

    animateBlock()
  }, [newBlock])

  return <Instances material={material} geometry={geometry}>
    {blocks.map((block) => {
      const { x, y, data } = block
      const blockType = getBlockType(data, stableHeight, heightBlocks)

      let scaleValue = scale[data.hash] || 1
      if (hoveredBlock && data.hash === hoveredBlock.data.hash) scaleValue = 1.3
      let boxScale = new Vector3(scaleValue, scaleValue, scaleValue)

      return <Instance key={data.hash} position={[x, y, 2]} color={getBlockColor(currentTheme, blockType)}
        onPointerOver={(e) => onPointerEnter(block, e)}
        onPointerOut={onPointerLeave}
        scale={boxScale}
        onClick={() => onClick(block)}
      >
        <Text name="hash" color="white" anchorX="center" anchorY="top" fontSize={.3} position={[0, .85, 0]}>
          {data.hash.slice(-6).toUpperCase()}
        </Text>
        {data.topoheight && <Text name="topoheight" color="black" anchorX="center"
          anchorY="middle" fontSize={.2} position={[0, 0, 4]}>
          {data.topoheight.toLocaleString()}
        </Text>}
      </Instance>
    })}
  </Instances>
}

function CanvasFrame() {
  const timeRef = useRef(Date.now())
  const fps = 1000 / 30 // 30 fps

  useFrame(({ gl, scene, camera }) => {
    const now = Date.now()
    const lastFrame = now - timeRef.current
    if (lastFrame > fps) {
      timeRef.current = now
      TWEEN.update()
      gl.render(scene, camera)
    }
  }, 1)

  return null
}

function DAG() {
  const nodeSocket = useNodeSocket()
  const [blocks, setBlocks] = useState([])
  const [heightBlocks, setHeightBlocks] = useState([])
  const [newBlock, setNewBlock] = useState()
  //const [blocks, setBlocks] = useState(mock.dag.reverse())

  const [loading, setLoading] = useState()
  const [info, setInfo] = useState({})
  const [err, setErr] = useState()
  const { t } = useLang()

  const stableHeight = info.stableheight

  const offCanvasBlock = useOffCanvasBlock({
    info,
    heightBlocks
  })

  const offCanvasTable = useOffCanvasTable({
    info,
    blocks,
    onBlockClick: (block) => {
      offCanvasBlock.open(block)
    },
    heightBlocks
  })

  const loadInfo = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, info] = await to(nodeSocket.daemon.methods.getInfo())
    if (err) return setErr(err)
    setInfo(info)
  }, [nodeSocket.readyState])

  const loadBlocks = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return
    if (!offCanvasTable.inputHeight) return // wait for inputheight to load

    const inputHeight = offCanvasTable.inputHeight
    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    let newBlocks = []
    const batch = 20 // can't fetch more than 20 at a time for getBlocksRangeByHeight
    let start = Math.max(-1, inputHeight - offCanvasTable.blockRange)
    let end = start + offCanvasTable.blockRange
    for (let i = start; i < end; i += batch) {
      let batchStart = i + 1
      let batchEnd = i + batch
      if (batchEnd > inputHeight) {
        batchEnd = inputHeight
        i = end
      }

      const [err, data] = await to(nodeSocket.daemon.methods.getBlocksRangeByHeight({
        start_height: batchStart,
        end_height: batchEnd
      }))
      if (err) return resErr(err)
      newBlocks = [...newBlocks, ...data]
    }

    setBlocks(newBlocks)
    setLoading(false)
  }, [offCanvasTable.inputHeight, offCanvasTable.blockRange, nodeSocket.readyState])

  useEffect(() => {
    if (offCanvasTable.paused) return
    loadInfo()
  }, [loadInfo, offCanvasTable.paused])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  useNodeSocketSubscribe({
    event: RPCEvent.NewBlock,
    onData: (_, newBlock) => {
      if (offCanvasTable.paused) return

      loadInfo()
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks

        const heights = blocks.map((b) => b.height)
        const minHeight = Math.min(...heights)
        const maxHeight = Math.max(...heights)
        const totalHeights = maxHeight - minHeight
        if (totalHeights >= offCanvasTable.blockRange - 1) {
          blocks = blocks.filter(b => b.height !== minHeight)
        }

        setNewBlock(newBlock)
        return [newBlock, ...blocks]
      })
    }
  }, [offCanvasTable.paused, offCanvasTable.blockRange])

  useNodeSocketSubscribe({
    event: RPCEvent.BlockOrdered,
    onData: async (_, data) => {
      if (offCanvasTable.paused) return

      const { topoheight, block_hash, block_type } = data
      const [err, blockData] = await to(nodeSocket.daemon.methods.getBlockByHash({ hash: block_hash }))
      if (err) return console.log(err)

      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          //block.topoheight = topoheight
          //block.block_type = block_type

          block = blockData
        }
        return block
      }))
    }
  }, [offCanvasTable.paused])

  useNodeSocketSubscribe({
    event: RPCEvent.BlockOrphaned,
    onData: async (_, data) => {
      if (offCanvasTable.paused) return

      const { block_hash, old_topoheight } = data
      const [err, blockData] = await to(nodeSocket.daemon.methods.getBlockByHash({ hash: block_hash }))
      if (err) return console.log(err)

      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          // block.block_type = BlockType.Orphaned
          block = blockData
        }
        return block
      }))
    }
  }, [offCanvasBlock.paused])

  const distanceX = 2.5
  const distanceY = 2
  const [blocksToRender, setBlocksToRender] = useState([])
  const [heightsText, setHeightsText] = useState([])
  const [heightCount, setHeightCount] = useState(0)

  useEffect(() => {
    let filteredBlocks = blocks
    if (offCanvasTable.hideOrphaned) {
      filteredBlocks = blocks.filter(x => x.block_type !== BlockType.Orphaned)
    }

    const blocksToRender = []
    const heightsText = []
    const entries = [...groupBy(filteredBlocks, (b) => b.height).entries()]
    setHeightBlocks(entries)
    entries.sort((a, b) => a[0] - b[0])
    setHeightCount(entries.length)

    entries.forEach(([height, innerBlocks], heightIndex) => {
      innerBlocks.sort((a, b) => {
        return a.hash.localeCompare(b.hash) // sort with hash because orphan block have null topoheight
        // return a.topoheight - b.topoheight
      }) // when dag is paused make sure its sorted to avoid displacement when fetching next block
      let evenCount = 0, oddCount = 0

      const x = heightIndex * distanceX

      innerBlocks.forEach((block, blockIndex) => {
        let y = 0
        if (innerBlocks.length > 1) {
          if (blockIndex % 2 === 0) {
            y = evenCount++ * distanceY + 1
          } else {
            y = oddCount-- * distanceY - 1
          }
        }

        blocksToRender.push({ data: block, x, y })

        if (innerBlocks.length - 1 === blockIndex) {
          //const x = x * distance
          y = Math.min(-0.5, -Math.floor(innerBlocks.length / 2)) * distanceY
          heightsText.push({ height, x, y })
        }
      })
    })

    setBlocksToRender(blocksToRender)
    setHeightsText(heightsText)
  }, [blocks, offCanvasTable.hideOrphaned])

  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [cursor, setCursor] = useState(`grab`)

  return <div>
    <Helmet>
      <title>DAG</title>
      <meta name="description" content={t(`XELIS BlockDAG inspector. Visualize a section of the network's blocks in 2D.`)} />
    </Helmet>
    <div className={style.canvas}>
      <Canvas style={{ cursor }} orthographic
        camera={{ position: [0, 0, 10], zoom: 100, up: [0, 0, 1], far: 10000 }}
        onMouseDown={() => {
          setCursor('grabbing')
          document.body.style.setProperty('user-select', 'none')
        }}
        onMouseUp={() => {
          setCursor('grab')
          document.body.style.removeProperty('user-select')
        }}
      >
        <CanvasFrame />
        <MapControls maxZoom={200} minZoom={5} enableDamping={false} enableRotate={false} />
        <group position={[-((heightCount * distanceX) - 2), 0, 0]}>
          <InstancedBlocks setCursor={setCursor} stableHeight={stableHeight} heightBlocks={heightBlocks}
            newBlock={newBlock} blocks={blocksToRender} setHoveredBlock={setHoveredBlock}
            hoveredBlock={hoveredBlock} offCanvasBlock={offCanvasBlock} />
          <InstancedLines blocks={blocksToRender} hoveredBlock={hoveredBlock} offCanvasTable={offCanvasTable} />
          {heightsText.map((text) => {
            const { height, x, y } = text
            return <Text key={height} color="white" anchorX="center"
              anchorY="middle" fontSize={.25} position={[x, y + 0.2, 4]}>
              {height.toLocaleString()}
            </Text>
          })}
        </group>
      </Canvas>
    </div>
    {offCanvasTable.render}
    {offCanvasBlock.render}
    <BottomInfo info={info} />
    <NodeStatus />
    <div className={style.status}>
      {(blocks.length > 0 && !offCanvasTable.paused) && <>
        {t('Last block ')}
        <Age ssrKey="last-block-timestamp" timestamp={blocks[0].timestamp} update format={{ secondsDecimalDigits: 0 }} />
        {t(' ago')}
      </>}
      {offCanvasTable.paused && t(`Paused`)}
    </div>
    <div className={style.controls}>
      <Button icon="house" link="/" />
      <Button icon="table-list" onClick={() => offCanvasTable.setOpened(true)} />
    </div>
  </div >
}

export default DAG