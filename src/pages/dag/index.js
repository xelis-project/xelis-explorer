import { Fragment, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Text, Line } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { Vector3 } from 'three'

import { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import { groupBy, reduceText } from '../../utils'
import { useNavigate } from 'react-router'
import useTheme from '../../context/useTheme'
import { NodeConnection } from '../../components/envAlert'
import OffCanvas from '../../components/offCanvas'
import Button from '../../components/button'

function BlockMesh(props) {
  const { title, block, onClick, ...restProps } = props
  const [hover, _setHover] = useState()

  const setCursor = useCallback((cursor) => {
    document.documentElement.style.cursor = cursor
  }, [])

  const setHover = useCallback((hover) => {
    if (hover) setCursor(`pointer`)
    else setCursor(``)
    _setHover(hover)
  })

  let color = `white`
  switch (block.block_type) {
    case 'Sync':
      color = `green`
      break
    case 'Side':
      color = `blue`
      break
  }

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  return <>
    <motion.mesh {...restProps}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      scale={0}
      animate={{ scale: 1 }}
      transition={{ duration: .5, ease: 'backInOut' }}
    >
      <Text color="gray" anchorX="center" anchorY="top" fontSize={.3} position={[0, .9, 0]}>
        {reduceText(block.hash, 0, 4)}
      </Text>
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshBasicMaterial color={color} wireframe={!hover}
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ delay: .1 }}
      />
    </motion.mesh>
  </>
}

function useOffCanvasControls(props) {
  const { topoheight, blocks, onBlockClick } = props
  const { toggleTheme } = useTheme()
  const navigate = useNavigate()
  const dagControlsRef = useRef()

  const [opened, setOpened] = useState(false)
  const [paused, setPaused] = useState(false)
  const [flat, setFlat] = useState(true)
  const [inputTopoheight, setInputTopoheight] = useState(0)
  const [lastBlockTime, setLastBlockTime] = useState(0)

  useEffect(() => {
    if (!topoheight) return
    setInputTopoheight(topoheight)
  }, [topoheight])

  useEffect(() => {
    if (paused) return
    const intervalId = setInterval(() => {
      setLastBlockTime(v => ++v)
    }, [1000])

    return () => {
      setLastBlockTime(0)
      clearInterval(intervalId)
    }
  }, [blocks, paused])

  const render = <OffCanvas
    title="Controls"
    opened={opened}
    width={500}
    position="right"
    onClose={() => setOpened(false)}
  >
    <div ref={dagControlsRef} className="dag-controls">
      <div className="dag-controls-items">
        <button className="button" onClick={() => {
          navigate(`/`)
        }}>Home</button>
        <button className="button" onClick={toggleTheme}>Toggle Theme</button>
        <div>
          <input type="checkbox" checked={flat} onChange={() => setFlat(!flat)} />
          <label>Flat</label>
        </div>
        <div>
          <input type="checkbox" checked={paused} onChange={() => setPaused(!paused)} />
          <label>Paused</label>
        </div>
        <div>{inputTopoheight}</div>
        <input type="range" min={20} max={topoheight} value={inputTopoheight} onChange={(e) => {
          setInputTopoheight(e.target.valueAsNumber)
        }} style={{ width: `100%` }} disabled={!paused} />
        <div className="dag-controls-buttons">
          <button className="button" disabled={!paused} onClick={() => setInputTopoheight(inputTopoheight - 10)}>Previous (10)</button>
          <button className="button" disabled={!paused} onClick={() => setInputTopoheight(inputTopoheight + 10)}>Next (10)</button>
        </div>
        {!paused && <div>Last block since {lastBlockTime}s...</div>}
        {paused && <div>Block update is paused.</div>}
        <div className="dag-controls-table">
          <table>
            <tbody>
              {blocks.map((block) => {
                return <tr key={block.hash} onClick={() => onBlockClick(block)}>
                  <td>{block.topoheight}</td>
                  <td>{block.block_type}</td>
                  <td>{reduceText(block.hash, 0, 4)}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </OffCanvas>

  return { render, setOpened, paused, flat, inputTopoheight }
}

function CameraWithControls(props) {
  const { flat, camRef, ...restProps } = props
  const [canMove, setCanMove] = useState(false)
  const { camera, gl } = useThree()
  const lastPosition = useRef()
  const lastDistance = useRef()

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

      camera.position.x -= deltaX * 0.015
      camera.position.y += deltaY * 0.015

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
      event.preventDefault()
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
      event.preventDefault()
      setCanMove(false)
    }

    const handleTouchEnd = (event) => {
      setCanMove(false)
    }

    const handleMouseMove = (event) => {
      event.preventDefault()
      if (!canMove) return
      updatePosition(event.clientX, event.clientY)
    }

    const handleTouchMove = (event) => {
      event.preventDefault()
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
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseout', handleMouseUp)
    gl.domElement.addEventListener('touchmove', handleTouchMove)
    gl.domElement.addEventListener('touchstart', handleTouchDown)
    gl.domElement.addEventListener('touchend', handleTouchEnd)

    return () => {
      gl.domElement.removeEventListener('wheel', handleZoom, { passive: true })
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mouseout', handleMouseUp)
      gl.domElement.removeEventListener('touchmove', handleTouchMove) // can't passive because we need preventDefault()
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

function useOffCanvasBlock(props) {
  const [block, setBlock] = useState({})
  const [opened, setOpened] = useState(false)

  const open = useCallback((block) => {
    setBlock(block)
    setOpened(true)
  }, [])

  const render = <OffCanvas title="Block Information" position="left"
    width={500} opened={opened} onClose={() => setOpened(false)}>
    <div style={{ wordBreak: `break-word` }}>
      {JSON.stringify(block)}
    </div >
  </OffCanvas>

  return { render, open }
}

function DAG() {
  const nodeRPC = useNodeRPC()
  const [blocks, setBlocks] = useState([])
  //const [blocks, setBlocks] = useState(dagMock.reverse())

  const [topoheight, setTopoheight] = useState()
  const cameraRef = useRef()

  const offCanvasBlock = useOffCanvasBlock()

  const offCanvasControls = useOffCanvasControls({
    topoheight,
    blocks,
    onBlockClick: (block) => {
      offCanvasBlock.open(block)
    }
  })

  const loadTopoheight = useCallback(async () => {
    const [err, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err) return console.log(err)

    setTopoheight(topoheight)
  }, [])

  const loadBlocks = useCallback(async () => {
    const inputTopoheight = offCanvasControls.inputTopoheight
    if (!inputTopoheight) return
    const [err, blocks] = await to(nodeRPC.getBlocks(inputTopoheight - 19, inputTopoheight))
    if (err) return console.log(err)

    setBlocks(blocks.reverse())
  }, [offCanvasControls.inputTopoheight])

  useEffect(() => {
    if (!offCanvasControls.paused) loadTopoheight()
  }, [offCanvasControls.paused])

  useEffect(() => {
    let timeoutId = setTimeout(() => loadBlocks(), [500])

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loadBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
      if (offCanvasControls.paused) return
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })
    }
  }, [offCanvasControls.paused])

  useNodeSocketSubscribe({
    event: `BlockOrdered`,
    onData: (data) => {
      if (offCanvasControls.paused) return
      const { topoheight, block_hash, block_type } = data
      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          block.topoheight = topoheight
          block.block_type = block_type
        }
        return block
      }))
    }
  }, [offCanvasControls.paused])

  useEffect(() => {
    if (blocks.length >= 20) {
      blocks.pop()
      setBlocks(blocks)
    }
  }, [blocks])

  const groupBlocks = useMemo(() => {
    /*const filteredBlocks = blocks.filter((block, index) => {
      return blocks.findIndex((item) => item.hash === block.hash) === index
    })*/ // in newBlock instead

    const entries = [...groupBy(blocks, (b) => b.height).entries()].reverse()
    entries.forEach(([height, innerBlocks], heightIndex) => {
      let evenCount = 0, oddCount = 0
      innerBlocks.forEach((block, blockIndex) => {
        let y = 0
        if (innerBlocks.length > 1) {
          if (blockIndex % 2 === 0) {
            y = evenCount++ * 2 + 1
          } else {
            y = oddCount-- * 2 - 1
          }
        }

        block.x = heightIndex
        block.y = y
      })
    })

    if (entries.length > 0) {
      const last = entries[entries.length - 1][1][0]
      if (cameraRef.current) cameraRef.current.position.x = last.x * 2
    }

    return entries
  }, [blocks])

  return <div>
    <Helmet>
      <title>DAG</title>
    </Helmet>
    {offCanvasControls.render}
    {offCanvasBlock.render}
    <div className="dag-header">
      <div className="dag-header-title">
        <div className="header-logo" />
        <h1>Xelis DAG</h1>
      </div>
      <NodeConnection />
    </div>
    <div className="dag-offcanvas-tr-buttons">
      <Button icon="home" link="/" />
      <Button icon="options" onClick={() => offCanvasControls.setOpened(true)} />
    </div>
    <div className="dag-loading-logo" />
    <div className="dag-canvas">
      <Canvas>
        <CameraWithControls camRef={cameraRef} flat={offCanvasControls.flat} />
        <group>
          {groupBlocks.map((entry, heightIndex) => {
            const [height, innerBlocks] = entry
            let even = heightIndex % 2 === 0
            const distance = 2
            return <Fragment key={height}>
              {/*<mesh position={[heightIndex * distance, 0, -1]}>
                <boxGeometry args={[distance, 1000, 0]} />
                <motion.meshBasicMaterial color={even ? `#333` : `#111`} />
          </mesh>*/}
              {innerBlocks.map((block, blockIndex) => {
                let { x, y } = block
                return <Fragment key={block.hash}>
                  {block.tips.map((tip) => {
                    const tipBlock = blocks.find((b) => b.hash === tip)
                    if (!tipBlock) return null
                    return <mesh key={tip}>
                      <Line points={[new Vector3(x * distance, y, 0), new Vector3(tipBlock.x * distance, tipBlock.y, 0)]} color="red" lineWidth={2} />
                    </mesh>
                  })}
                  <BlockMesh block={block} position={[x * distance, y, 0]} onClick={() => offCanvasBlock.open(block)} />
                  {innerBlocks.length - 1 === blockIndex && <Text color="black" anchorX="center"
                    anchorY="middle" fontSize={.3} position={[x * distance, 0, 1]}
                    outlineWidth={.05} outlineColor="#ffffff">
                    {height}
                  </Text>}
                </Fragment>
              })}
            </Fragment>
          })}
        </group>
      </Canvas>
    </div>
  </div>
}

export default DAG