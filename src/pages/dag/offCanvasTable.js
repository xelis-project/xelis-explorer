import { useEffect, useState, useMemo } from 'react'
import queryString from 'query-string'
import { useLocation } from 'react-router-dom'
import { css } from 'goober'

import OffCanvas from '../../components/offCanvas'
import Age from '../../components/age'
import Table from '../../components/table'
import { getBlockType } from './index'
import Button from '../../components/button'
import Icon from '../../components/icon'
import blockColor from './blockColor'
import useTheme from '../../context/useTheme'
import { scaleOnHover } from '../../style/animate'
import Switch from '../../components/switch'
import Dropdown from '../../components/dropdown'

const style = {
  container: css`
    overflow-y: auto;

    > :nth-child(2) {
      padding-bottom: 0;
      overflow: hidden;
    }

    table tr:hover td {
      background-color: var(--table-hover-bg-color);
      color: var(--table-hover-text-color);
      cursor: pointer;
    }

    table tr td:first-child > :nth-child(2) {
      font-size: .7em;
    }
  `,
  controls: css`
    display: flex;
    gap: 1em;
    padding: 1em;
    flex-direction: column;

    > :nth-child(1) > div {
      width: 100%;
    }

    > :nth-child(2) {
      display: flex;
      justify-content: space-between;
      gap: 1em;

      div {
        display: flex;
        gap: .5em;
        align-items: center;
      }
    }

    button {
      border: none;
      background-color: var(--text-color);
      color: var(--bg-color);
      border-radius: 50%;
      height: 40px;
      width: 40px;
      font-size: 1em;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      ${scaleOnHover({ scale: .9 })}
    }
  `,
  navControls: css`
    margin: 0 1em 1em 1em;

    > :nth-child(1) {
      margin-bottom: .5em;

      input {
        width: 100%;
        accent-color: var(--text-color);
      }
    }

    > :nth-child(2) {
      display: flex;
      gap: .5em;

      button {
        border: none;
        border-radius: 15px;
        padding: .5em 1em;
        background-color: var(--text-color);
        color: var(--bg-color);
        cursor: pointer;
        ${scaleOnHover}
      }
    }
  `
}

function HeightRangeInput(props) {
  const { height, inputHeight, setInputHeight } = props
  const [_value, setValue] = useState()

  let value = _value ? _value : inputHeight || 0
  const min = Math.max(0, height - 1000)
  return <div>
    <div>Height: {value}</div>
    <input type="range" value={value} step={1}
      onChange={(e) => setValue(e.target.valueAsNumber)}
      onMouseUp={() => {
        setValue(null)
        setInputHeight(value)
      }}
      min={min} max={height}
    />
  </div>
}

function useOffCanvasTable(props) {
  const { info, blocks, onBlockClick } = props

  const height = info.height
  const stableHeight = info.stableHeight

  const location = useLocation()
  const { theme: currentTheme } = useTheme()

  const searchHeight = useMemo(() => {
    const query = queryString.parse(location.search)
    const height = parseInt(query.height)
    if (!Number.isNaN(height)) return height
    return null
  }, [location])

  const [opened, setOpened] = useState(false)
  const [paused, setPaused] = useState(searchHeight ? true : false)
  const [hideOrphaned, setHideOrphaned] = useState(false)
  const [inputHeight, setInputHeight] = useState(searchHeight)
  const [maxHeights, setMaxHeights] = useState(20)

  useEffect(() => {
    if (!inputHeight) setInputHeight(height)
  }, [height, inputHeight])

  const filteredBlocks = useMemo(() => {
    if (hideOrphaned) return blocks.filter(x => x.block_type !== 'Orphaned').sort((a, b) => b.height - a.height)
    return blocks.sort((a, b) => b.height - a.height)
  }, [hideOrphaned, blocks])

  const dagMaxHeightList = useMemo(() => {
    return [
      { key: 20, text: `20` },
      { key: 50, text: `50` },
      { key: 100, text: `100` }
    ]
  })

  const render = <OffCanvas opened={opened} maxWidth={500} position="right" className={style.container}>
    <div>
      <div className={style.controls}>
        <div>
          <Dropdown items={dagMaxHeightList} defaultKey={maxHeights} onChange={(item) => {
            if (!paused) setInputHeight(height)
            setMaxHeights(item.key)
          }} prefix="Max Heights: " />
        </div>
        <div>
          <div>
            <Switch checked={hideOrphaned} onChange={() => setHideOrphaned(!hideOrphaned)} />
            <label>Hide Orphaned</label>
          </div>
          <div>
            <Button onClick={() => {
              setPaused(!paused)
              if (paused) setInputHeight(height)
            }}>
              {paused && <Icon name="play" />}
              {!paused && <Icon name="pause" />}
            </Button>
            <Button onClick={() => setOpened(false)} icon="close" />
          </div>
        </div>
      </div>
      {paused && <div className={style.navControls}>
        <HeightRangeInput height={height} inputHeight={inputHeight} setInputHeight={setInputHeight} />
        <div>
          <button onClick={() => setInputHeight(inputHeight - 1)}>Previous</button>
          <button onClick={() => setInputHeight(inputHeight - 10)}>Previous (10)</button>
          <button onClick={() => setInputHeight(inputHeight + 10)}>Next (10)</button>
          <button onClick={() => setInputHeight(inputHeight + 1)}>Next</button>
          <button onClick={() => setInputHeight(height)}>Reset</button>
        </div>
      </div>}
    </div>
    <Table
      headers={[`Topoheight`, `Type`, `Hash`, `Txs`, `Age`]}
      list={filteredBlocks} emptyText="No blocks" colSpan={5}
      onItem={(block, index) => {
        const txCount = block.txs_hashes.length
        const blockType = getBlockType(block, stableHeight)
        return <tr key={block.hash} onClick={() => onBlockClick(block)}>
          <td>
            <span>{block.topoheight}</span>&nbsp;
            <span title="Height">({block.height})</span>&nbsp;
          </td>
          <td style={{ color: blockColor.value(currentTheme, blockType) }}>
            {blockType}
          </td>
          <td>{block.hash.slice(-6).toUpperCase()}</td>
          <td>{txCount}</td>
          <td>
            <Age timestamp={block.timestamp} update />
          </td>
        </tr>
      }} />
  </OffCanvas>

  return { render, setOpened, paused, inputHeight, hideOrphaned, maxHeights }
}

export default useOffCanvasTable
