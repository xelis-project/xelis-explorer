import { useEffect, useState, useMemo, useCallback } from 'react'
import { css } from 'goober'
import Age from 'g45-react/components/age'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'
import useQueryString from 'g45-react/hooks/useQueryString'
import { BlockType } from '@xelis/sdk/daemon/types'

import OffCanvas from '../../components/offCanvas'
import Table from '../../components/table'
import { getBlockType } from './index'
import Button from '../../components/button'
import { getBlockColor } from './blockColor'
import useTheme from '../../hooks/useTheme'
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
      transition: .1s all;

      &:hover {
        transform: scale(.9);
      }
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
        transition: .1s all;

        &:hover {
          transform: scale(.98);
        }
      }
    }
  `
}

function HeightRangeInput(props) {
  const { height, inputHeight, setInputHeight } = props
  const [_value, setValue] = useState()

  let value = _value ? _value : inputHeight || 0
  const min = 0 //Math.max(0, height - 1000)
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
  const { info, blocks, onBlockClick, heightBlocks } = props

  const height = info.height
  const stableHeight = info.stableHeight

  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  const [query, setQuery] = useQueryString({})

  const queryHeight = useMemo(() => {
    const height = parseInt(query.height)
    if (!Number.isNaN(height)) return height
    return null
  }, [query])

  const queryBlockRange = useMemo(() => {
    const blockRange = parseInt(query.block_range)
    if (!Number.isNaN(blockRange)) return Math.min(blockRange, 100)
    return 20
  }, [query])

  const queryHideOrphaned = useMemo(() => {
    if (query.hide_orphaned) {
      return query.hide_orphaned.toLowerCase() === `true`
    }

    return false
  }, [query])

  const queryHideLines = useMemo(() => {
    if (query.hide_lines) {
      return query.hide_lines.toLowerCase() === `true`
    }

    return false
  }, [query])

  const setQueryKey = useCallback((key, value) => {
    let newQuery = Object.assign({}, query)
    if (value != null) {
      newQuery[key] = value.toString()
    } else {
      Reflect.deleteProperty(newQuery, key)
    }

    setQuery(newQuery)
  }, [query])

  const [opened, setOpened] = useState(false)
  const [paused, setPaused] = useState(queryHeight ? true : false)
  const [hideOrphaned, _setHideOrphaned] = useState(queryHideOrphaned)
  const [hideLines, _setHideLines] = useState(queryHideLines)
  const [inputHeight, _setInputHeight] = useState(queryHeight)
  const [blockRange, _setBlockRange] = useState(queryBlockRange)

  const setBlockRange = useCallback((value) => {
    setQueryKey(`block_range`, value)
    _setBlockRange(value)
  }, [setQueryKey])

  const setInputHeight = useCallback((value) => {
    setQueryKey(`height`, value)
    _setInputHeight(value)
  }, [query])

  const setHideLines = useCallback((value) => {
    setQueryKey(`hide_lines`, value)
    _setHideLines(value)
  }, [query])

  const setHideOrphaned = useCallback((value) => {
    setQueryKey(`hide_orphaned`, value)
    _setHideOrphaned(value)
  }, [query])

  useEffect(() => {
    if (inputHeight == null) {
      _setInputHeight(height)
    }
  }, [height, inputHeight])

  const filteredBlocks = useMemo(() => {
    if (hideOrphaned) return blocks.filter(x => x.block_type !== BlockType.Orphaned).sort((a, b) => b.topoheight - a.topoheight)
    return blocks.sort((a, b) => b.topoheight - a.topoheight)
  }, [hideOrphaned, blocks])

  const blockRangeList = useMemo(() => {
    return [
      { key: 20, text: `20` },
      { key: 50, text: `50` },
      { key: 100, text: `100` }
    ]
  }, [])

  const render = <OffCanvas opened={opened} maxWidth={500} position="right" className={style.container}>
    <div>
      <div className={style.controls}>
        <div>
          <Dropdown items={blockRangeList} value={blockRange} onChange={(item) => {
            if (!paused) setInputHeight(height)
            setBlockRange(item.key)
          }} prefix={t('Block Range: ')} />
        </div>
        <div>
          <div>
            <Switch checked={hideOrphaned} onChange={() => setHideOrphaned(!hideOrphaned)} />
            <label>{t('Hide Orphaned')}</label>
          </div>
          <div>
            <Switch checked={hideLines} onChange={() => setHideLines(!hideLines)} />
            <label>{t('Hide Lines')}</label>
          </div>
          <div>
            <Button onClick={() => {
              setPaused(!paused)
              if (paused) {
                setQueryKey(`height`, null)
                _setInputHeight(height)
              }
            }}>
              <Icon name={paused ? `play` : `pause`} />
            </Button>
            <Button onClick={() => setOpened(false)} icon="close" />
          </div>
        </div>
      </div>
      {paused && <div className={style.navControls}>
        <HeightRangeInput height={height} inputHeight={inputHeight} setInputHeight={setInputHeight} min={0} />
        <div>
          <button onClick={() => setInputHeight(inputHeight - 1)} disabled={inputHeight - 1 < 0}>
            {t('Previous')}
          </button>
          <button onClick={() => setInputHeight(inputHeight + 1)}>
            {t('Next')}</button>
          <button onClick={() => setInputHeight(inputHeight - 10)} disabled={inputHeight - 10 < 0}>
            {t('Previous (10)')}</button>
          <button onClick={() => setInputHeight(inputHeight + 10)}>
            {t('Next (10)')}
          </button>
          <button onClick={() => setInputHeight(height)}>
            {t('Reset')}
          </button>
        </div>
      </div>}
    </div>
    <Table
      headers={[t(`Topo Height`), t(`Type`), t(`Hash`), t(`Txs`), t(`Age`)]}
      list={filteredBlocks} emptyText={t('No blocks')} colSpan={5}
      onItem={(block, index) => {
        const txCount = (block.txs_hashes || []).length
        const blockType = getBlockType(block, stableHeight, heightBlocks)
        return <tr key={block.hash} onClick={() => onBlockClick(block)}>
          <td>
            <span>{(block.topoheight || 0).toLocaleString()}</span>&nbsp;
            <span title={t('Height')}>({(block.height || 0).toLocaleString()})</span>&nbsp;
          </td>
          <td style={{ color: getBlockColor(currentTheme, blockType) }}>
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

  return { render, setOpened, paused, inputHeight, hideOrphaned, blockRange, hideLines }
}

export default useOffCanvasTable
