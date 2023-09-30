import { css } from 'goober'
import { Helmet } from 'react-helmet-async'
import { useState } from 'react'

import useSettings, { defaultSettings, settingsKeys } from '../../context/useSettings'
import theme from '../../style/theme'
import Button from '../../components/button'
import { scaleOnHover } from '../../style/animate'

const style = {
  container: css`
    h1 {
      margin: 1.5em 0 1em 0;
      font-weight: bold;
      font-size: 2em;
    }

    .form-input {
      display: flex;
      gap: 1em;
      flex-direction: column;

      label {
        font-weight: bold;
        font-size: 1.2em;
      }

      input {
        padding: .7em;
        border-radius: 10px;
        border: none;
        outline: none;
        font-size: 1.2em;
        background-color: ${theme.apply({ xelis: `var(--text-color)`, dark: `var(--text-color)`, light: `var(--bg-color)` })};
        color: ${theme.apply({ xelis: `var(--bg-color)`, dark: `var(--bg-color)`, light: `var(--text-color)` })};
        box-shadow: inset 3px 3px 5px 0px #a5a5a5;
      }

      .buttons {
        display: flex;
        gap: 1em;

        ${theme.query.minDesktop} {
          max-width: 300px;
        }

        button {
          border: none;
          display: flex;
          gap: .5em;
          padding: .7em 1em;
          cursor: pointer;
          border-radius: 20px;
          width: 100%;
          font-weight: bold;
          font-size: 1em;
          align-items: center;
          ${scaleOnHover}
        }
      }
    }
  `
}

function Settings() {
  const { settings, setValue } = useSettings()

  const [nodeEnpoint, setNodeEndpoint] = useState(() => {
    return settings[settingsKeys.NODE_WS_ENDPOINT]
  })

  return <div className={style.container}>
    <Helmet>
      <title>Settings</title>
    </Helmet>
    <h1>Settings</h1>
    <div className="form-input">
      <label>Node Endpoint</label>
      <input type="text" value={nodeEnpoint} onChange={(e) => {
        setNodeEndpoint(e.target.value)
      }} placeholder="wss://127.0.0.1/ws" />
      <div className="buttons">
        <Button icon="circle" onClick={() => {
          setNodeEndpoint(defaultSettings[settingsKeys.NODE_WS_ENDPOINT])
        }}>Reset</Button>
        <Button icon="floppy-disk" onClick={() => {
          setValue(settingsKeys.NODE_WS_ENDPOINT, nodeEnpoint)
        }}>Apply</Button>
      </div>
    </div>
  </div>
}

export default Settings