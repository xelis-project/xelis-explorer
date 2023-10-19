import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Text, Segment, Segments, Instance, Instances, MapControls } from '@react-three/drei'
import { BoxGeometry, MeshBasicMaterial, Vector3 } from 'three'
import { css } from 'goober'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/daemon'
import { RPCEvent } from '@xelis/sdk/daemon/types'
import TWEEN from '@tweenjs/tween.js'

import { groupBy } from '../../utils'
import Button from '../../components/button'
import NodeStatus from '../../layout/node_status'
import useOffCanvasTable from './offCanvasTable'
import useOffCanvasBlock from './offCanvasBlock'
import blockColor from './blockColor'
import useTheme from '../../context/useTheme'
import BottomInfo from './bottomInfo'
import { scaleOnHover } from '../../style/animate'
import theme from '../../style/theme'
import Age from '../../components/age'

const style = {
  container: css`
    .canvas {
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
    }

    .controls {
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
        ${scaleOnHover({ scale: .9 })}
      }
    }

    .status {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 1em;
      display: flex;
      gap: .5em;
      flex-direction: column;

      > :nth-child(2) {
        font-size: .8em;
        text-align: center;
        position: relative;
      }
    }
  `
}

export function getBlockType(block, stableHeight) {
  if (block.block_type === 'Normal' && block.height <= stableHeight) {
    return "Sync"
  }

  return block.block_type
}

function InstancedLines(props) {
  const { blocks = [], hoveredBlock } = props

  const count = useMemo(() => {
    return blocks.reduce((t, b) => t + b.data.tips.length, 0)
  }, [blocks])

  const [lineWidth, setLineWidth] = useState(5)
  // scale line width based on camera zoom
  useFrame(({ camera }) => {
    let newLineWidth = 20 * (camera.zoom / 1000)
    setLineWidth(newLineWidth)
  })

  // make sure key is count or won't unmount - https://github.com/pmndrs/drei/issues/923
  return <Segments key={count} lineWidth={lineWidth} >
    {blocks.map((block) => {
      let { data, x, y } = block
      return data.tips.map((tip) => {
        const blockTip = blocks.find((b) => b.data.hash === tip)
        if (!blockTip) return null

        let z = 0
        let color = `lightgray`
        if (hoveredBlock && hoveredBlock.data.hash === data.hash) {
          color = `yellow`
          z = 1
        }

        const key = data.hash + tip
        return <Segment key={key} start={[blockTip.x, blockTip.y, z]} end={[x, y, z]} color={color} />
      })
    })}
  </Segments>
}

function InstancedBlocks(props) {
  const { blocks = [], newBlock, hoveredBlock, setHoveredBlock, offCanvasBlock, stableHeight, setCursor } = props

  const { theme: currentTheme } = useTheme()
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
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
      const blockType = getBlockType(data, stableHeight)

      let scaleValue = scale[data.hash] || 1
      if (hoveredBlock && data.hash === hoveredBlock.data.hash) scaleValue = 1.3
      let boxScale = new Vector3(scaleValue, scaleValue, scaleValue)

      return <Instance key={data.hash} position={[x, y, 2]} color={blockColor.value(currentTheme, blockType)}
        onPointerOver={(e) => onPointerEnter(block, e)}
        onPointerOut={onPointerLeave}
        scale={boxScale}
        onClick={() => onClick(block)}
      >
        <Text name="hash" color="gray" anchorX="center" anchorY="top" fontSize={.3} position={[0, .8, 0]}>
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
  useFrame(({ gl, scene, camera }) => {
    TWEEN.update()
    gl.render(scene, camera)
  }, 1)

  return null
}

function DAG() {
  const nodeSocket = useNodeSocket()
  const [blocks, setBlocks] = useState([])
  const [newBlock, setNewBlock] = useState()
  //const [blocks, setBlocks] = useState(dagMock.reverse())

  const [loading, setLoading] = useState()
  const [info, setInfo] = useState({})
  const [err, setErr] = useState()

  const stableHeight = info.stableheight

  const fetchMaxBlockHeight = 20
  const displayMaxBlockHeight = 20

  const offCanvasBlock = useOffCanvasBlock({ info })

  const offCanvasTable = useOffCanvasTable({
    info,
    blocks,
    onBlockClick: (block) => {
      offCanvasBlock.open(block)
    }
  })

  const loadInfo = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const [err, info] = await to(nodeSocket.daemon.getInfo())
    if (err) return setErr(err)
    setInfo(info)
  }, [nodeSocket])

  const loadBlocks = useCallback(async () => {
    if (nodeSocket.readyState !== WebSocket.OPEN) return

    const inputHeight = offCanvasTable.inputHeight
    if (!inputHeight) return
    setLoading(true)
    setErr(null)

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    let start = Math.max(0, inputHeight - (fetchMaxBlockHeight - 1))
    let end = inputHeight
    const [err, newBlocks] = await to(nodeSocket.daemon.getBlocksRangeByHeight({
      start_height: start,
      end_height: end
    }))
    if (err) return resErr(err)

    setBlocks(newBlocks)
    setLoading(false)
  }, [offCanvasTable.inputHeight, nodeSocket])

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
      loadInfo()
      if (!offCanvasTable.paused) {
        setNewBlock(newBlock)
        setBlocks((blocks) => {
          const entries = [...groupBy(blocks, (b) => b.height).entries()]
          entries.sort((a, b) => a[0] - b[0])
          if (entries.length >= displayMaxBlockHeight) {
            const height = entries[0][0]
            blocks = blocks.filter(b => b.height !== height)
          }

          if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
          return [newBlock, ...blocks]
        })
      }
    }
  }, [offCanvasTable.paused])

  useNodeSocketSubscribe({
    event: RPCEvent.BlockOrdered,
    onData: (_, data) => {
      if (offCanvasTable.paused) return
      const { topoheight, block_hash, block_type } = data
      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          block.topoheight = topoheight
          block.block_type = block_type
        }
        return block
      }))
    }
  }, [offCanvasTable.paused])

  const distance = 2
  const [blocksToRender, setBlocksToRender] = useState([])
  const [heightsText, setHeightsText] = useState([])

  useEffect(() => {
    let filteredBlocks = blocks
    if (offCanvasTable.hideOrphaned) {
      filteredBlocks = blocks.filter(x => x.block_type !== 'Orphaned')
    }

    const blocksToRender = []
    const heightsText = []
    const entries = [...groupBy(filteredBlocks, (b) => b.height).entries()]
    entries.sort((a, b) => a[0] - b[0])

    entries.forEach(([height, innerBlocks], heightIndex) => {
      innerBlocks.sort((a, b) => a.topoheight - b.topoheight) // when dag is paused make sure its sorted to avoid displacement when fetching next block
      let evenCount = 0, oddCount = 0

      const x = heightIndex * distance

      innerBlocks.forEach((block, blockIndex) => {
        let y = 0
        if (innerBlocks.length > 1) {
          if (blockIndex % 2 === 0) {
            y = evenCount++ * distance + 1
          } else {
            y = oddCount-- * distance - 1
          }
        }

        blocksToRender.push({ data: block, x, y })

        if (innerBlocks.length - 1 === blockIndex) {
          //const x = x * distance
          y = Math.min(-0.5, -Math.floor(innerBlocks.length / 2)) * distance
          heightsText.push({ height, x, y })
        }
      })
    })

    /*
    if (blocksToRender.length > 0) {
      const last = blocksToRender[blocksToRender.length - 1]
      setTimeout(() => {
        if (cameraRef.current) cameraRef.current.position.x = last.x
      }, 100)
    }
    */

    setBlocksToRender(blocksToRender)
    setHeightsText(heightsText)
  }, [blocks, offCanvasTable.hideOrphaned])

  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [cursor, setCursor] = useState(`grab`)

  return <div className={style.container}>
    <Helmet>
      <title>DAG</title>
    </Helmet>
    <div className="canvas">
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
        <MapControls maxZoom={200} minZoom={10} enableDamping={false} enableRotate={false} />
        <group position={[-34, 0, 0]}>
          <InstancedBlocks setCursor={setCursor} stableHeight={stableHeight}
            newBlock={newBlock} blocks={blocksToRender} setHoveredBlock={setHoveredBlock}
            hoveredBlock={hoveredBlock} offCanvasBlock={offCanvasBlock} />
          <InstancedLines blocks={blocksToRender} hoveredBlock={hoveredBlock} />
          {heightsText.map((text) => {
            const { height, x, y } = text
            return <Text key={height} color="white" anchorX="center"
              anchorY="middle" fontSize={.20} position={[x, y + 0.25, 4]}>
              {height.toLocaleString()}
            </Text>
          })}
        </group>
      </Canvas>
    </div>
    {offCanvasTable.render}
    {offCanvasBlock.render}
    <BottomInfo info={info} />
    <div className="status">
      <NodeStatus />
      <div>
        {(blocks.length > 0 && !offCanvasTable.paused) && <>
          Last block&nbsp;
          <Age timestamp={blocks[0].timestamp} update format={{ secondsDecimalDigits: 0 }} />
          &nbsp;ago
        </>}
        {offCanvasTable.paused && `Paused`}
      </div>
    </div>
    <div className="controls">
      <Button icon="house" link="/" />
      <Button icon="table-list" onClick={() => offCanvasTable.setOpened(true)} />
    </div>
  </div>
}

export default DAG