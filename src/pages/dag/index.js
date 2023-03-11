import { Fragment, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Text, Line, PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { Vector3 } from 'three'

import { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import { groupBy, reduceText } from '../../utils'
import dagMock from './dagMock'
import useOffCanvas from '../../hooks/useOffCanvas'
import { useNavigate } from 'react-router'
import useTheme from '../../context/useTheme'
import Icon from '../../components/icon'
import { NodeConnection } from '../../components/envAlert'

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

function useControls(props) {
  const { topoheight, blocks, openBlockOffCanvas } = props
  const { toggleTheme } = useTheme()
  const navigate = useNavigate()
  const dagControlsRef = useRef()

  const [grabbing, setGrabbing] = useState(false)
  const [position, setPosition] = useState({ top: 20, right: 20 })
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

  useEffect(() => {
    if (!grabbing) return

    const startX = dagControlsRef.current.offsetLeft
    const startY = dagControlsRef.current.offsetTop
    const boxW = dagControlsRef.current.offsetWidth
    const boxH = dagControlsRef.current.offsetHeight
    const w = window.innerWidth
    const h = window.innerHeight

    let offsetX, offsetY

    const onMouseMove = (e) => {
      if (!offsetX) offsetX = e.x - startX
      if (!offsetY) offsetY = e.y - startY

      const x = e.x - offsetX
      const y = e.y - offsetY
      if (x >= 0 && (x + boxW) <= w) {
        setPosition(({ top }) => ({ left: x, top }))
      }

      if (y >= 0 && (y + boxH) <= h) {
        setPosition(({ left }) => ({ top: y, left }))
      }
    }

    const onMouseOut = (e) => {
      if (e.relatedTarget === null) {
        setGrabbing(false)
      }
    }

    window.addEventListener(`mouseout`, onMouseOut)
    window.addEventListener(`mousemove`, onMouseMove)
    return () => {
      window.removeEventListener(`mousemove`, onMouseMove)
      window.removeEventListener(`mouseout`, onMouseOut)
    }
  }, [grabbing])

  useEffect(() => {
    const onResize = () => {
      setPosition({ top: 20, right: 20 })
    }

    window.addEventListener(`resize`, onResize)
    return () => {
      window.removeEventListener(`resize`, onResize)
    }
  }, [])

  const component = <div ref={dagControlsRef} className="dag-controls" style={{ ...position }}>
    <div className="dag-controls-header"
      style={{ cursor: grabbing ? `grabbing` : `grab` }}
      onMouseDown={() => setGrabbing(true)}
      onMouseUp={() => setGrabbing(false)}>
      <Icon name="options" />
      <div>Controls</div>
    </div>
    <div className="dag-controls-items">
      <button className="button" onClick={() => navigate(`/`)}>Home</button>
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
      <div>
        <button className="button" disabled={!paused} onClick={() => setInputTopoheight(inputTopoheight - 10)}>Previous (10)</button>
        <button className="button" disabled={!paused} onClick={() => setInputTopoheight(inputTopoheight - 10)}>Next (10)</button>
      </div>
      {!paused && <div>Last block since {lastBlockTime}s...</div>}
      {paused && <div>Block update is paused.</div>}
      <div style={{ maxHeight: 250, overflowY: `auto`, width: `100%` }}>
        <table>
          <tbody>
            {blocks.map((block) => {
              return <tr key={block.hash} onClick={() => openBlockOffCanvas(block)} style={{ cursor: `pointer` }}>
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

  return { component, paused, flat, inputTopoheight }
}

function CameraWithControls(props) {
  const { flat, camRef, ...restProps } = props
  const [mouseDown, setMouseDown] = useState(false)
  const { camera, gl } = useThree()
  const lastMousePosition = useRef([0, 0])

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
    const handleMouseDown = (event) => {
      event.preventDefault()
      setMouseDown(true)
      lastMousePosition.current = [event.clientX, event.clientY]
    }

    const handleMouseUp = (event) => {
      event.preventDefault()
      setMouseDown(false)
    }

    const handleMouseMove = (event) => {
      event.preventDefault()
      if (!mouseDown) return

      const [lastX, lastY] = lastMousePosition.current
      const deltaX = event.clientX - lastX
      const deltaY = event.clientY - lastY

      camera.position.x -= deltaX * 0.015
      camera.position.y += deltaY * 0.015

      lastMousePosition.current = [event.clientX, event.clientY]
      camera.updateProjectionMatrix()
    }

    const handleZoom = (event) => {
      const delta = event.deltaY
      const speed = camera.zoom / 5
      camera.zoom += delta > 0 ? -speed : +speed
      //camera.zoom = Math.max(5, Math.min(camera.zoom, 140))
      camera.updateProjectionMatrix()
    }

    gl.domElement.addEventListener('wheel', handleZoom, { passive: true })
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseout', handleMouseUp)

    return () => {
      gl.domElement.removeEventListener('wheel', handleZoom, { passive: true })
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.addEventListener('mouseout', handleMouseUp)
    }
  }, [mouseDown, camera, gl])

  return <orthographicCamera
    ref={camRef}
    {...restProps}
  >
    <primitive object={camera} />
  </orthographicCamera>
}

function DAG() {
  const nodeRPC = useNodeRPC()
  const [blocks, setBlocks] = useState([])
  //const [blocks, setBlocks] = useState(dagMock.reverse())

  const [topoheight, setTopoheight] = useState()
  const offCanvas = useOffCanvas()
  const cameraRef = useRef()

  const openBlockOffCanvas = useCallback((block) => {
    offCanvas.createOffCanvas({
      title: `Block`,
      component: <div style={{ wordBreak: `break-word` }}>
        {JSON.stringify(block)}
      </div >,
      width: 500
    })
  }, [offCanvas])

  const controls = useControls({ topoheight, blocks, openBlockOffCanvas })

  const loadTopoheight = useCallback(async () => {
    const [err, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err) return console.log(err)

    setTopoheight(topoheight)
  }, [])

  const loadBlocks = useCallback(async () => {
    const inputTopoheight = controls.inputTopoheight
    if (!inputTopoheight) return
    const [err, blocks] = await to(nodeRPC.getBlocks(inputTopoheight - 19, inputTopoheight))
    if (err) return console.log(err)

    setBlocks(blocks.reverse())
  }, [controls.inputTopoheight])

  /*useEffect(() => {
    loadTopoheight()
  }, [loadTopoheight])*/

  useEffect(() => {
    if (!controls.paused) loadTopoheight()
  }, [controls.paused])

  useEffect(() => {
    let timeoutId = setTimeout(() => loadBlocks(), [500])

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loadBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
      if (controls.paused) return
      setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })
    }
  }, [controls.paused])

  useNodeSocketSubscribe({
    event: `BlockOrdered`,
    onData: (data) => {
      if (controls.paused) return
      const { topoheight, block_hash, block_type } = data
      setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) {
          block.topoheight = topoheight
          block.block_type = block_type
        }
        return block
      }))
    }
  }, [controls.paused])

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
      cameraRef.current.position.x = last.x * 2
    }

    return entries
  }, [blocks])

  return <div>
    <Helmet>
      <title>DAG</title>
    </Helmet>
    <div className="dag-header">
      <h1>Xelis DAG</h1>
      <NodeConnection />
    </div>
    {controls.component}
    <div className="dag-canvas">
      <Canvas>
        <CameraWithControls camRef={cameraRef} flat={controls.flat} />
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
                  <BlockMesh block={block} position={[x * distance, y, 0]} onClick={() => openBlockOffCanvas(block)} />
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