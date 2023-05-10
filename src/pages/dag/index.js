import { Fragment, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Helmet } from 'react-helmet-async'
import to from 'await-to-js'
import { Text, Line } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { Vector3 } from 'three'

import { useNodeSocketSubscribe } from '../../context/useNodeSocket'
import useNodeRPC from '../../hooks/useNodeRPC'
import { formattedBlock, groupBy, reduceText } from '../../utils'
import { NodeConnection } from '../../components/envAlert'
import OffCanvas from '../../components/offCanvas'
import Button from '../../components/button'
import { Link } from 'react-router-dom'
import { ToggleThemeButton } from '../../components/header'
import Age from '../../components/age'
import prettyMilliseconds from 'pretty-ms'

const BLOCK_COLOR = {
  'Normal': `gray`,
  'Sync': `green`,
  'Side': `blue`,
  'Orphaned': `red`,
}

function BlockMesh(props) {
  const { title, block, onPointerEnter, onPointerLeave, onClick, ...restProps } = props

  const setCursor = useCallback((cursor) => {
    document.documentElement.style.cursor = cursor
  }, [])

  const setHoverState = useCallback((value) => {
    if (value) {
      if (typeof onPointerEnter === `function`) onPointerEnter()
      setCursor(`pointer`)
    }
    else {
      if (typeof onPointerLeave === `function`) onPointerLeave()
      setCursor(``)
    }
  }, [onPointerEnter, onPointerLeave])

  let color = BLOCK_COLOR[block.block_type] || `black`

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  let topoheight = block.topoheight ? reduceText(block.topoheight.toString(), 0, 4) : `--`

  return <>
    <motion.mesh {...restProps}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      onPointerEnter={() => setHoverState(true)}
      onPointerLeave={() => setHoverState(false)}
      scale={0}
      animate={{ scale: 1 }}
      transition={{ duration: .25, ease: 'backInOut' }}
    >
      <Text color="gray" anchorX="center" anchorY="top" fontSize={.3} position={[0, .9, 0]}>
        {reduceText(block.hash, 0, 4)}
      </Text>
      <Text color="black" anchorX="center"
        anchorY="middle" fontSize={.3} position={[0, 0, 4]}
        outlineWidth={.05} outlineColor="#ffffff">
        {topoheight}
      </Text>
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshBasicMaterial
        color={color}
        //wireframe={!hover}
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ delay: .1 }}
      />
    </motion.mesh>
  </>
}

function BlockTypeLegend() {
  return <div className="dag-legend">
    {Object.keys(BLOCK_COLOR).map((key) => {
      const color = BLOCK_COLOR[key]
      return <div key={key} className="dag-legend-item">
        <div className="dag-legend-type">{key}</div>
        <div className="dag-legend-color" style={{ backgroundColor: color }}></div>
      </div>
    })}
  </div>
}

function HeightRangeInput(props) {
  const { height, inputHeight, setInputHeight, paused } = props
  const [_value, setValue] = useState()

  let value = _value ? _value : inputHeight || 0

  return <div style={{ width: `100%` }}>
    <div>Height: {value}</div>
    <input type="range" value={value} step={1}
      onChange={(e) => setValue(e.target.valueAsNumber)}
      onMouseUp={() => {
        setValue(null)
        setInputHeight(value)
      }}
      min={0} max={height}
      disabled={!paused} style={{ width: `100%` }} />
  </div>
}

function useOffCanvasControls(props) {
  const { height, blocks, onBlockClick } = props

  const [opened, setOpened] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hideOrphaned, setHideOrphaned] = useState(false)
  const [inputHeight, setInputHeight] = useState()
  const [lastBlockTime, setLastBlockTime] = useState(0)

  useEffect(() => {
    if (!inputHeight) setInputHeight(height)
  }, [height])

  useEffect(() => {
    if (paused) return

    const intervalId = setInterval(() => {
      setLastBlockTime(v => v += 1000)
    }, [1000])

    let last = 0
    if (blocks && blocks.length > 0) {
      last = new Date().getTime() - blocks[0].timestamp
    }

    setLastBlockTime(last)

    return () => {
      clearInterval(intervalId)
    }
  }, [blocks, paused])

  const filteredBlocks = useMemo(() => {
    if (hideOrphaned) return blocks.filter(x => x.block_type !== 'Orphaned')
    return blocks
  }, [hideOrphaned, blocks])

  const render = <OffCanvas title="Controls" opened={opened}
    width={500} position="right" onClose={() => setOpened(false)}>
    <div className="dag-controls-items">
      <div>
        <input type="checkbox" checked={hideOrphaned} onChange={() => setHideOrphaned(!hideOrphaned)} />
        <label>Hide Orphaned</label>
      </div>
      <div>
        <input type="checkbox" checked={paused} onChange={(e) => {
          const value = e.target.checked
          setPaused(value)
          if (!value) setInputHeight(height)
        }} />
        <label>Pause DAG</label>
      </div>
      <HeightRangeInput height={height}
        inputHeight={inputHeight} setInputHeight={setInputHeight} paused={paused} />
      <div className="dag-controls-buttons">
        <button className="button" disabled={!paused}
          onClick={() => setInputHeight(inputHeight - 1)}>
          Previous
        </button>
        <button className="button" disabled={!paused}
          onClick={() => setInputHeight(inputHeight - 10)}>
          Previous (10)
        </button>
        <button className="button" disabled={!paused}
          onClick={() => setInputHeight(inputHeight + 10)}>
          Next (10)
        </button>
        <button className="button" disabled={!paused}
          onClick={() => setInputHeight(inputHeight + 1)}>
          Next
        </button>
      </div>
      {!paused && <div>Last block since {prettyMilliseconds(lastBlockTime, { secondsDecimalDigits: 0 })}...</div>}
      {paused && <div>Block update is paused.</div>}
    </div>
    <div className="dag-controls-table">
      <table>
        <thead>
          <tr style={{ position: `sticky`, top: 0, background: `white` }}>
            <th>Height</th>
            <th>Type</th>
            <th>Hash</th>
            <th>Txs</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {filteredBlocks.map((block) => {
            const txCount = block.txs_hashes.length
            return <tr key={block.hash} onClick={() => onBlockClick(block)}>
              <td>
                <span title="Height">{block.height}</span>&nbsp;
                {block.topoheight && <span title="Topo Height">({block.topoheight})</span>}
              </td>
              <td style={{ color: BLOCK_COLOR[block.block_type] || `black` }}>
                {block.block_type}
              </td>
              <td>{reduceText(block.hash, 0, 4)}</td>
              <td>{txCount}</td>
              <td>
                <Age timestamp={block.timestamp} update />
              </td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </OffCanvas>

  return { render, setOpened, paused, inputHeight, hideOrphaned }
}

function CameraWithControls(props) {
  const { flat = true, camRef, ...restProps } = props
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
      gl.domElement.removeEventListener('wheel', handleZoom, { passive: true })
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

function useOffCanvasBlock(props) {
  const { topoheight } = props
  const [block, setBlock] = useState()
  const [opened, setOpened] = useState(false)
  const nodeRPC = useNodeRPC()

  const open = useCallback((block) => {
    setBlock(block)
    setOpened(true)
  }, [])

  const formatBlock = useMemo(() => {
    if (!block) return {}
    return formattedBlock(block, topoheight || 0)
  }, [block, topoheight])

  const loadBlock = useCallback(async (topoheight) => {
    const [err, blockData] = await to(nodeRPC.getBlockAtTopoHeight(topoheight))
    if (err) return resErr(err)
    setBlock(blockData)
  }, [])

  const render = <OffCanvas title="Block Information" position="left"
    width={500} opened={opened} onClose={() => setOpened(false)}>
    {block && <>
      <div className="left-right-buttons">
        {formatBlock.hasPreviousBlock && <Button className="button" onClick={() => loadBlock(block.topoheight - 1)} icon="chevron-left-r">
          Previous Block ({block.topoheight - 1})
        </Button>}
        {formatBlock.hasNextBlock && <Button className="button" onClick={() => loadBlock(block.topoheight + 1)} icon="chevron-right-r" iconLocation="right">
          Next Block ({block.topoheight + 1})
        </Button>}
      </div>
      <div className="dag-offcanvas-block">
        <table>
          <tbody>
            <tr>
              <th>Block Type</th>
            </tr>
            <tr>
              <td>{block.block_type}</td>
            </tr>
            <tr>
              <th>Hash</th>
            </tr>
            <tr>
              <td>
                <Link to={`/blocks/${block.hash}`}>{block.hash}</Link>
              </td>
            </tr>
            <tr>
              <th>Timestamp</th>
            </tr>
            <tr>
              <td>{formatBlock.date} ({block.timestamp})</td>
            </tr>
            <tr>
              <th>Confirmations</th>
            </tr>
            <tr>
              <td>{formatBlock.confirmations}</td>
            </tr>
            <tr>
              <th>Topo Height</th>
            </tr>
            <tr>
              <td>{block.topoheight}</td>
            </tr>
            <tr>
              <th>Height</th>
            </tr>
            <tr>
              <td>{block.height}</td>
            </tr>
            <tr>
              <th>Miner</th>
            </tr>
            <tr>
              <td>{block.miner}</td>
            </tr>
            <tr>
              <th>Reward</th>
            </tr>
            <tr>
              <td>{formatBlock.reward}</td>
            </tr>
            <tr>
              <th>Txs</th>
            </tr>
            <tr>
              <td>{block.txs_hashes.length}</td>
            </tr>
            <tr>
              <th>Difficulty</th>
            </tr>
            <tr>
              <td>
                <span>{block.difficulty} </span>
                <span title="Cumulative Difficulty">
                  ({block.cumulative_difficulty})
                </span>
              </td>
            </tr>
            <tr>
              <th>Hash Rate</th>
            </tr>
            <tr>
              <td>
                {formatBlock.hashRate}
              </td>
            </tr>
            <tr>
              <th>Size</th>
            </tr>
            <tr>
              <td>{formatBlock.size}</td>
            </tr>
            <tr>
              <th>Nonce</th>
            </tr>
            <tr>
              <td>
                <span>{block.nonce} </span>
                <span title="Extra Nonce">({block.extra_nonce})</span>
              </td>
            </tr>
            <tr>
              <th>Tips</th>
            </tr>
            <tr>
              <td style={{ lineHeight: `1.4em` }}>
                {block.tips.map((tip, index) => {
                  return <div key={tip} style={{ wordBreak: `break-all` }}>
                    {index + 1}. <Link to={`/blocks/${tip}`}>{tip}</Link>
                  </div>
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>}
  </OffCanvas>

  return { render, open }
}

function DAG() {
  const nodeRPC = useNodeRPC()
  const [blocks, setBlocks] = useState([])
  //const [blocks, setBlocks] = useState(dagMock.reverse())

  const [loading, setLoading] = useState(true)
  const [topoheight, setTopoheight] = useState()
  const [height, setHeight] = useState()
  const cameraRef = useRef()

  const maxBlockHeight = 20

  const offCanvasBlock = useOffCanvasBlock({ topoheight })

  const offCanvasControls = useOffCanvasControls({
    height,
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

  const loadHeight = useCallback(async () => {
    const [err, height] = await to(nodeRPC.getHeight())
    if (err) return console.log(err)

    setHeight(height)
  }, [])

  const loadBlocks = useCallback(async () => {
    const inputHeight = offCanvasControls.inputHeight
    if (!inputHeight) return

    setLoading(true)
    let start = Math.max(0, inputHeight - (maxBlockHeight - 1))
    let end = inputHeight
    const [err, blocks] = await to(nodeRPC.getBlocksRangeByHeight(start, end))
    setLoading(false)
    if (err) return console.log(err)
    if (blocks) setBlocks(blocks.reverse())
  }, [offCanvasControls.inputHeight])

  useEffect(() => {
    if (!offCanvasControls.paused) {
      loadHeight()
      loadTopoheight()
    }
  }, [offCanvasControls.paused])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  useNodeSocketSubscribe({
    event: `NewBlock`,
    onData: (newBlock) => {
      loadHeight()
      loadTopoheight()
      //setTopoheight(newBlock.topoheight)
      //if (newBlock.height) setHeight(newBlock.height)

      if (!offCanvasControls.paused) {
        setBlocks((blocks) => {
          const entries = [...groupBy(blocks, (b) => b.height).entries()].reverse()
          if (entries.length > maxBlockHeight) {
            const height = entries[0][0]
            blocks = blocks.filter(b => b.height !== height)
          }

          if (blocks.findIndex(block => block.hash === newBlock.hash) !== -1) return blocks
          return [newBlock, ...blocks]
        })
      }
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

  const distance = 2

  const groupBlocks = useMemo(() => {
    let filteredBlocks = blocks
    if (offCanvasControls.hideOrphaned) {
      filteredBlocks = blocks.filter(x => x.block_type !== 'Orphaned')
    }

    const entries = [...groupBy(filteredBlocks, (b) => b.height).entries()].reverse()
    entries.forEach(([height, innerBlocks], heightIndex) => {
      innerBlocks.sort((a, b) => a.topoheight - b.topoheight) // when dag is paused make sure its sorted to avoid displacement when fetching next block
      let evenCount = 0, oddCount = 0

      innerBlocks.forEach((block, blockIndex) => {
        let y = 0
        if (innerBlocks.length > 1) {
          if (blockIndex % 2 === 0) {
            y = evenCount++ * distance + 1
          } else {
            y = oddCount-- * distance - 1
          }
        }

        block.x = heightIndex
        block.y = y
      })
    })

    if (entries.length > 0) {
      const last = entries[entries.length - 1][1][0]
      setTimeout(() => {
        if (cameraRef.current) cameraRef.current.position.x = last.x * distance
      }, 100)
    }

    return entries
  }, [blocks, offCanvasControls.hideOrphaned])

  const [hoveredBlock, setHoveredBlock] = useState(null)

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
      <BlockTypeLegend />
      <div>Height: {height} | Topoheight: {topoheight}</div>
    </div>
    <div className="dag-offcanvas-tr-buttons">
      <Button icon="home" link="/" />
      <Button icon="options" onClick={() => offCanvasControls.setOpened(true)} />
      <ToggleThemeButton />
    </div>
    {!cameraRef.current && <div className="dag-loading-logo" />}
    <div className="dag-canvas">
      <Canvas>
        <CameraWithControls camRef={cameraRef} flat={offCanvasControls.flat} />
        {cameraRef.current && <group>
          {groupBlocks.map((entry, heightIndex) => {
            const [height, innerBlocks] = entry
            //let even = heightIndex % 2 === 0
            //const distance = 4
            return <Fragment key={height}>
              {/*<mesh position={[heightIndex * distance, 0, -1]}>
                <boxGeometry args={[distance, 1000, 0]} />
                <motion.meshBasicMaterial color={even ? `#333` : `#111`} />
          </mesh>*/}
              {innerBlocks.map((block, blockIndex) => {
                let { x, y } = block
                return <Fragment key={block.hash}>
                  {block.tips.map((tip) => {
                    const blockTip = blocks.find((b) => b.hash === tip)
                    if (!blockTip) return null
                    //console.log(blockTip)
                    //if (!blockTip.x && !blockTip.y) return null

                    let z = 0
                    let color = `lightgray`
                    let lineWidth = 2
                    if (hoveredBlock && hoveredBlock.hash === block.hash) {
                      color = `yellow`
                      z = 1
                      lineWidth = 4
                    }

                    const points = [new Vector3(blockTip.x * distance, blockTip.y, z), new Vector3(x * distance, y, z)]
                    //console.log(points)
                    return <mesh key={tip}>
                      <Line points={points}
                        color={color} lineWidth={lineWidth} />
                    </mesh>
                  })}
                  <BlockMesh block={block} position={[x * distance, y, 2]} onClick={() => offCanvasBlock.open(block)}
                    onPointerEnter={() => setHoveredBlock(block)} onPointerLeave={() => setHoveredBlock(null)}
                  />
                  {innerBlocks.length - 1 === blockIndex && <Text color="black" anchorX="center"
                    anchorY="middle" fontSize={.3} position={[x * distance, Math.min(-0.5, -Math.floor(innerBlocks.length / 2)) * distance, 4]}
                    outlineWidth={.05} outlineColor="#ffffff">
                    {reduceText(height.toString(), 0, 4)}
                  </Text>}
                </Fragment>
              })}
            </Fragment>
          })}
        </group>}
      </Canvas>
    </div>
  </div>
}

export default DAG