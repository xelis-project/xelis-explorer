import { css } from 'goober'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import Icon from 'g45-react/components/fontawesome_icon'

import theme from '../style/theme'

const defaultStyle = {
  container: css`
    --dropdown-bg-color: ${theme.apply({ xelis: '#101010', dark: 'var(--bg-color)', light: 'var(--bg-color)' })};
    --dropdown-text-color: var(--text-color);
    position: relative;
    white-space: nowrap;
    color: var(--text-color);
  `,
  dropdown: css`
    padding: .5em;
    border: thin solid var(--dropdown-text-color);
    background-color: var(--dropdown-bg-color);
    border-radius: .5em;
    cursor: pointer;
    display: flex;
    gap: .5em;
    justify-content: space-between;
    align-items: center;
    position: relative;
    font-weight: bold;
  `,
  value: css`
    overflow: hidden;
    user-select: none;
  `,
  list: css`
    position: absolute;
    width: 100%;
    clip-path: inset(-.5em 0 0 0);
    visibility: hidden;
    z-index: 1;

    &[data-open="true"] {
      visibility: visible;
    }
  `,
  items: css`
    border: thin solid var(--dropdown-text-color);
    background-color: var(--dropdown-bg-color);
    overflow: auto;
    transition: .25s all;
    max-height: 10em;
    margin-top: -.5em;
    padding-top: .5em;
    border-bottom-right-radius: 15px;
    border-top: none;
    border-bottom-left-radius: 15px;
    transform-origin: top;
    transform: translateY(-100%);

    &[data-open="true"] {
      transform: translateY(0);
      opacity: 1;
    }
  `,
  item: css`
    user-select: none;
    padding: .5em;
    cursor: pointer;

    &:hover {
      background-color: var(--dropdown-text-color);
      color: var(--dropdown-bg-color);
    }
  `,
  separator: css`
    border-bottom: thin solid var(--dropdown-text-color);
    opacity: .5;
    background-color: inherit;
    color: inherit;
    cursor: inherit;
  `,
  icon: css`
    &[data-open="true"] {
      transform: rotate(180deg);
    }
  `
}

function Dropdown(props) {
  const { items = [], onChange, value, size = 1,
    notSelectedText = `Choose an option`, prefix = ``, styling = defaultStyle, ...restProps } = props

  const [selectedKey, setSelectedKey] = useState(value)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef()

  const onSelect = useCallback((item) => {
    setSelectedKey(item.key)
    setOpen(false)
    if (typeof onChange === `function`) onChange(item)
  }, [onChange])

  useEffect(() => {
    // close dropdown if we click outside the dropdown
    const onClick = (e) => {
      const outsideClick = !dropdownRef.current.contains(e.target)
      if (outsideClick) {
        setOpen(false)
      }
    }

    document.addEventListener(`click`, onClick)
    return () => {
      return document.removeEventListener(`click`, onClick)
    }
  }, [])

  useEffect(() => {
    setSelectedKey(value)
  }, [value])

  const selectedItem = useMemo(() => {
    return items.find((item) => item.key === selectedKey)
  }, [selectedKey, items])

  return <div ref={dropdownRef} className={styling.container} style={{ fontSize: `${size}em` }} {...restProps}>
    <div onClick={() => setOpen(!open)} className={styling.dropdown}>
      <div className={styling.value}>{selectedItem ? <>{prefix}{selectedItem.text}</> : notSelectedText}</div>
      <Icon name="arrow-down" />
    </div>
    <div data-open={open} className={styling.list}>
      <div data-open={open} className={styling.items}>
        {items.map((item) => {
          if (item.type === `separator`) {
            return <div key={item.key} className={styling.separator}>
              {item.text}
            </div>
          }

          return <div key={item.key} onClick={() => onSelect(item)} className={styling.item}>
            {item.text}
          </div>
        })}
      </div>
    </div>
  </div>
}

export default Dropdown