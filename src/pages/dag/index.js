import { Fragment, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Helmet } from 'react-helmet'
import to from 'await-to-js'
import { OrbitControls, Text, Line, OrthographicCamera } from '@react-three/drei'
import { Vector3 } from 'three'
import { useNavigate } from 'react-router-dom'

import { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import { groupBy, reduceText } from '../../utils'
// import dagMock from './dagMock'

function BlockMesh(props) {
  const { title, block, ...restProps } = props
  const [hover, _setHover] = useState()
  const navigate = useNavigate()

  const setCursor = useCallback((cursor) => {
    document.documentElement.style.cursor = cursor
  }, [])

  const onBlockClick = useCallback((hash) => {
    setCursor(``)
    navigate(`/blocks/${hash}`)
  }, [])

  const setHover = useCallback((hover) => {
    if (hover) setCursor(`pointer`)
    else setCursor(``)
    _setHover(hover)
  })

  return <>
    <mesh {...restProps}
      onClick={(e) => onBlockClick(block.hash)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}>
      <Text color="gray" anchorX="left" anchorY="top" fontSize={.4} position={[-.5, 1, 0]}>
        {title}
      </Text>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="white" wireframe={!hover} />
    </mesh>
  </>
}

function DAG() {
  const nodeRPC = useNodeRPC()
  const [blocks, setBlocks] = useState([])

  const loadBlocks = useCallback(async () => {
    const [err1, topoheight] = await to(nodeRPC.getTopoHeight())
    if (err1) return console.log(err1)

    const [err2, blocks] = await to(nodeRPC.getBlocks(topoheight - 19, topoheight))
    if (err2) return console.log(err2)

    setBlocks(blocks.reverse())
  }, [])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
      setBlocks((blocks) => [newBlock, ...blocks])
    }
  })

  useEffect(() => {
    if (blocks.length >= 20) {
      blocks.pop()
      setBlocks(blocks)
    }
  }, [blocks])

  const groupBlocks = useMemo(() => {
    return [...groupBy(blocks, (b) => b.height).entries()]
  }, [blocks])

  return <div>
    <Helmet>
      <title>DAG</title>
    </Helmet>
    <h1>DAG</h1>
    <Canvas className="dag-canvas">
      <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={40} />
      {groupBlocks.map((entry, groupIndex) => {
        const [height, blocks] = entry
        let even = 0, odd = 1
        return blocks.map((block, blockIndex) => {
          let x = groupIndex * 2
          let y = 0

          const remainder = blockIndex % 2
          if (remainder === 0) {
            y = -even * 2
            even++
          } else {
            y = odd * 2
            odd++
          }

          let title = block.height
          if (blockIndex > 0) {
            title = reduceText(block.hash, 0, 4)
          }

          return <Fragment key={block.hash}>
            <BlockMesh title={title} block={block} position={[-x, y, 0]} />
            {groupIndex < groupBlocks.length - 1 && <mesh>
              <Line points={[new Vector3(-x, y, 0), new Vector3(-x - 2, 0, 0)]} color="rgb(1,1,255)" lineWidth={2} />
            </mesh>}
          </Fragment>
        })
      })}
      <OrbitControls enableDamping={false} enableRotate={false} />
    </Canvas>
  </div>
}

export default DAG