import { useEffect, useState, useMemo } from 'react'
import queryString from 'query-string'
import { useLocation } from 'react-router-dom'
import { css } from 'goober'

import OffCanvas from '../../components/offCanvas'
import Age from '../../components/age'
import TableBody, { style as tableStyle } from '../../components/tableBody'
import { getBlockType } from './index'
import Button from '../../components/button'
import Icon from '../../components/icon'
import blockColor from './blockColor'
import useTheme from '../../context/useTheme'
import { scaleOnHover } from '../../style/animate'
import Switch from '../../components/switch'

const style = {
  container: css`
    overflow-y: auto;

    table tr:hover td {
      background-color: var(--table-hover-bg-color);
      color: var(--table-hover-text-color);
      cursor: pointer;
    }

    table .height {
      font-size: .7em;
    }
  `,
  controls: css`
    .start-buttons {
      display: flex;
      gap: 1em;
      justify-content: end;
      align-items: center;
      padding: 1em;

      > :nth-child(1) {
        display: flex;
        gap: .5em;
        align-items: center;
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
    }

    .edit-buttons {
      padding: 0 1em 1em 1em;

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
    }
  `
}

function HeightRangeInput(props) {
  const { height, inputHeight, setInputHeight } = props
  const [_value, setValue] = useState()

  let value = _value ? _value : inputHeight || 0

  return <div>
    <div>Height: {value}</div>
    <input type="range" value={value} step={1}
      onChange={(e) => setValue(e.target.valueAsNumber)}
      onMouseUp={() => {
        setValue(null)
        setInputHeight(value)
      }}
      min={0} max={height}
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

  useEffect(() => {
    if (!inputHeight) setInputHeight(height)
  }, [height, inputHeight])

  const filteredBlocks = useMemo(() => {
    if (hideOrphaned) return blocks.filter(x => x.block_type !== 'Orphaned').sort((a, b) => b.height - a.height)
    return blocks.sort((a, b) => b.height - a.height)
  }, [hideOrphaned, blocks])

  const render = <OffCanvas opened={opened} maxWidth={500} position="right" className={style.container}>
    <div className={style.controls}>
      <div className="start-buttons">
        <div>
          <Switch checked={hideOrphaned} onChange={() => setHideOrphaned(!hideOrphaned)} />
          <label>Hide Orphaned</label>
        </div>
        <Button onClick={() => {
          setPaused(!paused)
          if (paused) setInputHeight(height)
        }}>
          {paused && <Icon name="play" />}
          {!paused && <Icon name="pause" />}
        </Button>
        <Button onClick={() => setOpened(false)} icon="close" />
      </div>
      {paused && <div className="edit-buttons">
        <HeightRangeInput height={height}
          inputHeight={inputHeight} setInputHeight={setInputHeight} />
        <div className="table-buttons">
          <button onClick={() => setInputHeight(inputHeight - 1)}>Previous</button>
          <button onClick={() => setInputHeight(inputHeight - 10)}> Previous (10)</button>
          <button onClick={() => setInputHeight(inputHeight + 10)}>Next (10)</button>
          <button onClick={() => setInputHeight(inputHeight + 1)}>Next</button>
          <button onClick={() => setInputHeight(height)}>Reset</button>
        </div>
      </div>}
    </div>
    <div className={tableStyle}>
      <table>
        <thead>
          <tr>
            <th>Topo Height</th>
            <th>Type</th>
            <th>Hash</th>
            <th>Txs</th>
            <th>Age</th>
          </tr>
        </thead>
        <TableBody list={filteredBlocks} emptyText="No blocks" colSpan={5}
          onItem={(block, index) => {
            const txCount = block.txs_hashes.length
            const blockType = getBlockType(block, stableHeight)
            return <tr key={block.hash} onClick={() => onBlockClick(block)}>
              <td>
                <span>{block.topoheight}</span>&nbsp;
                <span title="Height" className="height">({block.height})</span>&nbsp;
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
          }}>
        </TableBody>
      </table>
    </div>
  </OffCanvas>

  return { render, setOpened, paused, inputHeight, hideOrphaned }
}

export default useOffCanvasTable
