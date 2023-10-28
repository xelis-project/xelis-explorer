import { css } from 'goober'
import { useState } from 'react'
import Icon from 'g45-react/components/fontawesome_icon'

const defaultStyle = {
  switch: css`
    width: 2.5em;
    height: 1.5em;
    background-color: var(--text-color);
    border-radius: 15px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;

    > div {
      background-color: var(--bg-color);
      width: 50%;
      border-radius: 50%;
      height: 80%;
      transition: all .25s;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      transform: translate(10%, 0);

      &[data-checked="true"] {
        transform: translate(90%, 0);
      }

      > i {
        position: absolute;
        font-size: .5em;
      }
    }
  `
}

function Switch(props) {
  const { styling = defaultStyle } = props
  const [checked, setChecked] = useState(props.checked)

  return <div className={styling.switch} onClick={() => {
    setChecked(!checked)
    if (typeof props.onChange === `function`) props.onChange(!checked)
  }}>
    <div data-checked={checked}>
      <Icon name={checked ? `check` : `close`} />
    </div>
  </div>
}

export default Switch