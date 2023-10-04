import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Text, Segment, Segments, Instance, Instances } from '@react-three/drei'
import { BoxGeometry, MeshBasicMaterial } from 'three'
import { css } from 'goober'
import prettyMs from 'pretty-ms'
import { useNodeSocket, useNodeSocketSubscribe } from '@xelis/sdk/react/context'
import { RPCEvent } from '@xelis/sdk/daemon/types'

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

function CameraWithControls(props) {
  const { flat = true, camRef, ...restProps } = props
  const [canMove, _setCanMove] = useState(false)
  const { camera, gl } = useThree()
  const lastPosition = useRef()
  const lastDistance = useRef()

  // don't select text when moving out of canvas
  const setCanMove = useCallback((value) => {
    _setCanMove(value)
    if (value) document.body.style.setProperty('user-select', 'none')
    else document.body.style.removeProperty('user-select')
  }, [])

  useEffect(() => {
    if (flat) {
      camera.zoom = 140
      camera.position.z = 1000
    } else {
      camera.position.z = 6
      camera.zoom = 1
    }

    camera.updateProjectionMatrix()
  }, [flat])

  useEffect(() => {
    let touchMoveTimeoutId
    const updatePosition = (x, y) => {
      const [lastX, lastY] = lastPosition.current
      const deltaX = x - lastX
      const deltaY = y - lastY

      camera.position.x -= deltaX / camera.zoom // use camera.zoom to change move speed :)
      camera.position.y += deltaY / camera.zoom // * 0.015

      lastPosition.current = [x, y]
      camera.updateProjectionMatrix()
    }

    const updateZoom = (deltaY, speed) => {
      const _speed = camera.zoom / speed
      camera.zoom += deltaY > 0 ? -_speed : +_speed
      //camera.zoom = Math.max(5, Math.min(camera.zoom, 140))
      camera.updateProjectionMatrix()
    }

    const handleMouseDown = (event) => {
      //event.preventDefault()
      setCanMove(true)
      lastPosition.current = [event.clientX, event.clientY]
    }

    const handleTouchDown = (event) => {
      const touches = event.touches
      if (touches.length === 1) {
        setCanMove(true)
        lastPosition.current = [touches[0].clientX, touches[0].clientY]
      }

      if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        lastDistance.current = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const handleMouseUp = (event) => {
      //event.preventDefault()
      setCanMove(false)
    }

    const handleTouchEnd = (event) => {
      setCanMove(false)
    }

    const handleMouseMove = (event) => {
      //event.preventDefault()
      if (!canMove) return
      updatePosition(event.clientX, event.clientY)
    }

    const handleTouchMove = (event) => {
      //event.preventDefault()
      const touches = event.touches

      if (canMove && touches.length === 1) {
        updatePosition(touches[0].clientX, touches[0].clientY)
      }

      if (touches.length === 2) {
        if (touchMoveTimeoutId) clearTimeout(touchMoveTimeoutId)
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        let distance = Math.sqrt(dx * dx + dy * dy)
        touchMoveTimeoutId = setTimeout(() => lastDistance.current = distance, 100)
        updateZoom(-(distance - lastDistance.current), 50)
      }
    }

    const handleZoom = (event) => {
      updateZoom(event.deltaY, 5)
    }

    gl.domElement.addEventListener('wheel', handleZoom, { passive: true })
    gl.domElement.addEventListener('mousedown', handleMouseDown, { passive: true })
    gl.domElement.addEventListener('mouseup', handleMouseUp, { passive: true })
    gl.domElement.addEventListener('mousemove', handleMouseMove, { passive: true })
    gl.domElement.addEventListener('mouseout', handleMouseUp, { passive: true })
    gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: true })
    gl.domElement.addEventListener('touchstart', handleTouchDown, { passive: true })
    gl.domElement.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      gl.domElement.removeEventListener('wheel', handleZoom)
      gl.domElement.removeEventListener('mousedown', handleMouseDown, { passive: true })
      gl.domElement.removeEventListener('mouseup', handleMouseUp, { passive: true })
      gl.domElement.removeEventListener('mousemove', handleMouseMove, { passive: true })
      gl.domElement.removeEventListener('mouseout', handleMouseUp, { passive: true })
      gl.domElement.removeEventListener('touchmove', handleTouchMove, { passive: true }) // can't passive because we need preventDefault()
      gl.domElement.removeEventListener('touchstart', handleTouchDown, { passive: true })
      gl.domElement.removeEventListener('touchend', handleTouchEnd, { passive: true }) // don't preventDefault here it will cancel onClick event for block info
    }
  }, [canMove, camera, gl])

  return <orthographicCamera
    ref={camRef}
    {...restProps}
  >
    <primitive object={camera} />
  </orthographicCamera>
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
  const { blocks = [], setHoveredBlock, offCanvasBlock, stableHeight } = props

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
    document.body.style.setProperty('cursor', 'pointer')
    e.eventObject.scale.set(1.3, 1.3, 1.3)
  }, [pointerDown])

  const onPointerLeave = useCallback((e) => {
    if (pointerDown) return
    if (e.object.name === 'topoheight') return
    if (e.object.name === 'hash') return

    setHoveredBlock(null)
    document.body.style.removeProperty('cursor')
    e.eventObject.scale.set(1, 1, 1)
  }, [pointerDown])

  const onClick = useCallback((block) => {
    offCanvasBlock.open(block.data)
  }, [offCanvasBlock])

  return <Instances material={material} geometry={geometry}>
    {blocks.map((block) => {
      const { x, y, data } = block
      const blockType = getBlockType(data, stableHeight)
      return <Instance key={data.hash} position={[x, y, 2]} color={blockColor.value(currentTheme, blockType)}
        onPointerOver={(e) => onPointerEnter(block, e)}
        onPointerOut={onPointerLeave}
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
  const previousTimeRef = useRef(0)

  const fpsRef = useRef(50)
  const fpsDropTimeout = 2000

  // lower fps if mouse is not moving - reduce cpu usage
  useEffect(() => {
    let timeoutId = null
    const pointerMove = () => {
      if (timeoutId) clearTimeout(timeoutId)
      fpsRef.current = 50

      timeoutId = setTimeout(() => {
        fpsRef.current = 1
      }, fpsDropTimeout)
    }

    window.addEventListener('wheel', pointerMove)
    window.addEventListener('pointermove', pointerMove)
    return () => {
      window.removeEventListener('wheel', pointerMove)
      window.removeEventListener('pointermove', pointerMove)
    }
  }, [])

  useFrame(({ gl, scene, camera, clock }) => {
    const currentTime = clock.getElapsedTime()
    const delta = currentTime - previousTimeRef.current
    const fps = 1 / fpsRef.current

    if (delta > fps) {
      gl.render(scene, camera)
      previousTimeRef.current = currentTime - (delta % fps)
    }
  }, 1)

  return null
}

function DAG() {
  const nodeSocket = useNodeSocket()
  const [blocks, setBlocks] = useState([])
  //const [blocks, setBlocks] = useState(dagMock.reverse())

  const [loading, setLoading] = useState()
  const [info, setInfo] = useState({})
  const [err, setErr] = useState()

  const stableHeight = info.stableheight

  const cameraRef = useRef()

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
    if (!nodeSocket.connected) return
    const [err, info] = await to(nodeSocket.daemon.getInfo())
    if (err) return setErr(err)
    setInfo(info)
  }, [nodeSocket])

  const loadBlocks = useCallback(async () => {
    if (!nodeSocket.connected) return
    const inputHeight = offCanvasTable.inputHeight
    if (!inputHeight) return

    const resErr = (err) => {
      setLoading(false)
      setErr(err)
    }

    setLoading(true)
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
    if (cameraRef.current) {
      // use fixed value of 38 instead of calculating last block position on page load
      // this avoid flickering and seeing block moving from left to right
      cameraRef.current.position.x = 38
    }

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

  return <div className={style.container}>
    <Helmet>
      <title>DAG</title>
    </Helmet>
    <div className="canvas">
      <Canvas>
        <CanvasFrame />
        <CameraWithControls camRef={cameraRef} flat />
        <InstancedBlocks stableHeight={stableHeight} blocks={blocksToRender} setHoveredBlock={setHoveredBlock} offCanvasBlock={offCanvasBlock} />
        <InstancedLines blocks={blocksToRender} hoveredBlock={hoveredBlock} />
        {heightsText.map((text) => {
          const { height, x, y } = text
          return <Text key={height} color="white" anchorX="center"
            anchorY="middle" fontSize={.20} position={[x, y + 0.25, 4]}>
            {height.toLocaleString()}
          </Text>
        })}
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