import { Fragment, useEffect, useState, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Helmet } from 'react-helmet'
import to from 'await-to-js'
import { OrbitControls, Text, Line, OrthographicCamera } from '@react-three/drei'
import { motion } from 'framer-motion-3d'

import { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import { groupBy } from '../../utils'
import dagMock from './dagMock'
import useOffCanvas from '../../hooks/useOffCanvas'

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

function DAG() {
  const nodeRPC = useNodeRPC()
  //const [blocks, setBlocks] = useState([])
  const [blocks, setBlocks] = useState(dagMock.reverse())
  const [paused, _setPaused] = useState(false)

  const [topoheight, setTopoheight] = useState()
  const [inputTopoheight, setInputTopoheight] = useState(0)
  const offCanvas = useOffCanvas()

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
      if (paused) return
      /*setBlocks((blocks) => {
        if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
        return [newBlock, ...blocks]
      })*/
    }
  }, [paused])

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

  const setPaused = useCallback(() => {
    if (paused) loadTopoheight()
    _setPaused(!paused)
  }, [paused])

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
    <h1>DAG</h1>
    <button className="button" onClick={() => setPaused(!paused)}>
      {paused ? `Play` : `Pause`}
    </button>
    <input type="range" min={20} max={topoheight} value={inputTopoheight} onChange={(e) => {
      setInputTopoheight(e.target.valueAsNumber)
    }} style={{ width: `100%` }} disabled={!paused} />
    <div>{inputTopoheight}</div>
    <button className="button" disabled={!paused} onClick={() => setInputTopoheight((v) => v - 10)}>
      Previous (10)
    </button>
    <button className="button" disabled={!paused} onClick={() => setInputTopoheight((v) => v + 10)}>
      Next (10)
    </button>
    <Canvas className="dag-canvas">
      <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={40} />
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
              {/*<mesh>
                <Line points={[new Vector3(-x, y, 0), new Vector3(-x - (distance / 2), 0, 0)]} color="gray" lineWidth={2} />
              </mesh>
              <mesh>
                <Line points={[new Vector3(-x, y, 0), new Vector3(-x + (distance / 2), 0, 0)]} color="gray" lineWidth={2} />
          </mesh>*/}
              <BlockMesh block={block} position={[-x, y, 0]} onClick={() => openBlockOffCanvas(block)} />
              {blocks.length - 1 === groupIndex && <Text color="white" anchorX="center" anchorY="top" fontSize={.3} position={[-x, 1 * blocks.length + 1, 0]}>
                {height}
              </Text>}
            </Fragment>
          })}
        </Fragment>
      })}
      <OrbitControls enableDamping={false} enableRotate={false} />
    </Canvas>
  </div>
}

export default DAG