import { Fragment, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Helmet } from 'react-helmet'
import to from 'await-to-js'
import { OrbitControls, Text, Line, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { motion } from 'framer-motion-3d'

import { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import { groupBy } from '../../utils'
import dagMock from './dagMock'
import useOffCanvas from '../../hooks/useOffCanvas'
import { useNavigate } from 'react-router'
import useTheme from '../../context/useTheme'
import Icon from '../../components/icon'
import { Vector3 } from 'three'

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
      <Text color="gray" anchorX="center" anchorY="top" fontSize={.4} position={[0, 1, 0]}>
        {block.topoheight}
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

function useControls() {
  const { toggleTheme } = useTheme()
  const navigate = useNavigate()
  const dagControlsRef = useRef()

  const [grabbing, setGrabbing] = useState(false)
  const [pos, setPos] = useState({ top: 20, right: 20 })
  const [paused, setPaused] = useState(false)
  const [_3D, set3D] = useState(false)

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
        setPos(({ top }) => ({ left: x, top }))
      }

      if (y >= 0 && (y + boxH) <= h) {
        setPos(({ left }) => ({ top: y, left }))
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

  const component = <div ref={dagControlsRef} className="dag-controls" style={{ ...pos }}>
    <div className="dag-controls-header"
      style={{ cursor: grabbing ? `grabbing` : `grab` }}
      onMouseDown={() => setGrabbing(true)}
      onMouseUp={() => setGrabbing(false)}>
      <Icon name="options" />
      <div>Controls</div>
    </div>
    <div className="dag-controls-items">
      <button className="button" onClick={() => navigate(`/`)}>Home</button>
      <div>
        <input type="checkbox" checked={paused} onChange={() => setPaused(!paused)} />
        <label>Paused</label>
      </div>
      <div>
        <input type="checkbox" checked={_3D} onChange={() => set3D(!_3D)} />
        <label>3D</label>
      </div>
      <button className="button" onClick={toggleTheme}>Toggle Theme</button>
    </div>
  </div>

  return { component, paused, _3D }
}

function DAG() {
  const nodeRPC = useNodeRPC()
  //const [blocks, setBlocks] = useState([])
  const [blocks, setBlocks] = useState(dagMock.reverse())

  const [topoheight, setTopoheight] = useState()
  const [inputTopoheight, setInputTopoheight] = useState(0)
  const offCanvas = useOffCanvas()
  const controls = useControls()

  const loadTopoheight = useCallback(async () => {
    const [err, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err) return console.log(err)

    setTopoheight(topoheight)
    setInputTopoheight(topoheight)
  }, [])

  const loadBlocks = useCallback(async () => {
    if (!inputTopoheight) return
    const [err, blocks] = await to(nodeRPC.getBlocks(inputTopoheight - 19, inputTopoheight))
    if (err) return console.log(err)

    //setBlocks(blocks.reverse())
  }, [inputTopoheight])

  useEffect(() => {
    loadTopoheight()
  }, [loadTopoheight])

  useEffect(() => {
    let timeoutId = setTimeout(() => loadBlocks(), [100])

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loadBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
      if (controls.paused) return
      /*setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })*/
    }
  }, [controls.paused])

  useNodeSocketSubscribe({
    event: `BlockOrdered`,
    onData: (data) => {
      const { topoheight, block_hash } = data
      /*setBlocks((blocks) => blocks.map(block => {
        if (block.hash === block_hash) block.topoheight = topoheight
        return block
      }))*/
    }
  }, [])

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

    return [...groupBy(blocks, (b) => b.height).entries()]
  }, [blocks])

  const openBlockOffCanvas = useCallback((block) => {
    offCanvas.createOffCanvas({
      title: `Block`,
      component: <div>
        {JSON.stringify(block)}
      </div>,
      width: 500
    })
  }, [offCanvas])

  return <div>
    <Helmet>
      <title>DAG</title>
    </Helmet>
    <div className="dag-title">Xelis DAG</div>
    {controls.component}
    <div className="dag-canvas">
      <Canvas>
        {!controls._3D && <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={40} />}
        {controls._3D && <PerspectiveCamera makeDefault position={[0, 0, 20]} rotateY={180} />}
        {groupBlocks.map((entry, heightIndex) => {
          const [height, blocks] = entry
          let even = 0, odd = 0
          let distance = 3

          return <Fragment key={height}>
            {blocks.map((block, groupIndex) => {
              let x = heightIndex * distance
              let y = 0
              if (blocks.length > 1) {
                if (groupIndex % 2 === 0) {
                  y = even++ * 2 + 1
                } else {
                  y = odd-- * 2 - 1
                }
              }

              return <Fragment key={block.hash}>
                <mesh>
                  <Line points={[new Vector3(-x, y, 0), new Vector3(-x - (distance / 2), 0, 0)]} color="gray" lineWidth={2} />
                </mesh>
                <mesh>
                  <Line points={[new Vector3(-x, y, 0), new Vector3(-x + (distance / 2), 0, 0)]} color="gray" lineWidth={2} />
                </mesh>
                <BlockMesh block={block} position={[-x, y, 0]} onClick={() => openBlockOffCanvas(block)} />
                {blocks.length - 1 === groupIndex && <Text color="white" anchorX="center" anchorY="top" fontSize={.3} position={[-x, 1 * blocks.length + 1, 0]}>
                  {height}
                </Text>}
              </Fragment>
            })}
          </Fragment>
        })}
        <OrbitControls enableDamping={false} enableRotate={controls._3D} />
      </Canvas>
    </div>
  </div>
}

export default DAG