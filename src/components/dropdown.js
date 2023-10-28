import { css } from 'goober'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import Icon from 'g45-react/components/fontawesome_icon'

import theme from '../style/theme'

const defaultStyle = {
  dropdown: css`
  --dropdown-bg-color: ${theme.apply({ xelis: '#101010', dark: 'var(--bg-color)', light: 'var(--bg-color)' })};
  --dropdown-text-color: var(--text-color);
  position: relative;
  white-space: nowrap;
  color: var(--text-color);

  > :nth-child(1) {
    padding: .5em;
    border: 1px solid var(--dropdown-text-color);
    background-color: var(--dropdown-bg-color);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    gap: .5em;
    justify-content: space-between;
    align-items: center;
    position: relative;
    font-weight: bold;

    > :nth-child(1) {
      overflow: hidden;
      user-select: none;
    }

    > :nth-child(2) {
      transition: .25s all;
    }
  }

  > :nth-child(2) {
    max-width: 100%;
    min-width: 100%;
    position: absolute;
    border: 1px solid var(--dropdown-text-color);
    background-color: var(--dropdown-bg-color);
    overflow: auto;
    cursor: pointer;
    transition: .25s all;
    opacity: 0;
    max-height: 10em;
    transform: scaleY(0);
    margin-top: -10px;
    padding-top: 10px;
    border-bottom-right-radius: 15px;
    border-top: none;
    border-bottom-left-radius: 15px;
    transform-origin: top;
    z-index: 1;

    > div {
      user-select: none;
      padding: .5em;

      &:hover {
        background-color: white;
        color: black;
      }
    }
  }
  
  &[data-open="true"] {
    > :nth-child(1) > :nth-child(2) {
      transform: rotate(180deg);
    }

    > :nth-child(2) {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  `
}

function Dropdown(props) {
  const { items = [], onChange, defaultKey, size = 1,
    notSelectedText = `Choose an option`, prefix = ``, styling = defaultStyle, ...restProps } = props

  const [selectedKey, setSelectedKey] = useState(defaultKey)
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

  const selectedText = useMemo(() => {
    const item = items.find((item) => item.key === selectedKey)
    if (item) return item.text
    return notSelectedText
  }, [selectedKey, items])

  return <div ref={dropdownRef} data-open={open} className={defaultStyle.dropdown} style={{ fontSize: `${size}em` }} {...restProps}>
    <div onClick={() => setOpen(!open)}>
      <div>{prefix}{selectedText}</div>
      <Icon name="arrow-down" />
    </div>
    <div>
      {items.map((item) => {
        return <div key={item.key} onClick={() => onSelect(item)}>{item.text}</div>
      })}
    </div>
  </div>
}

export default Dropdown