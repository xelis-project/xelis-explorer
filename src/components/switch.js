import { css } from 'goober'
import { useState } from 'react'
import Icon from './icon'

const style = css`
  width: 2.5em;
  height: 1.5em;
  background-color: var(--text-color);
  border-radius: 15px;
  display: inline-block;
  cursor: pointer;
  padding: .2em;

  > div {
    background-color: var(--bg-color);
    width: 50%;
    border-radius: 50%;
    height: 100%;
    transition: all .25s;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    &.on {
      transform: translate(1em, 0);
    }

    > i {
      position: absolute;
      font-size: .5em;
    }
  }
`

function Switch(props) {
  const [checked, setChecked] = useState(props.checked)

  return <div className={style} onClick={() => {
    setChecked(!checked)
    if (typeof props.onChange === `function`) props.onChange(!checked)
  }}>
    <div className={checked ? `on` : ``}>
      <Icon name={checked ? `check` : `close`} />
    </div>
  </div>
}

export default Switch