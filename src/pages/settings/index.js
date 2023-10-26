import { css } from 'goober'
import { useState } from 'react'

import useSettings, { defaultSettings, settingsKeys } from '../../context/useSettings'
import theme from '../../style/theme'
import Button from '../../components/button'
import { scaleOnHover } from '../../style/animate'
import PageTitle from '../../layout/page_title'
import Dropdown from '../../components/dropdown'
import { useMemo } from 'react'

const style = {
  container: css`
    .form-items {
      display: flex;
      gap: 2em;
      flex-direction: column;
    }

    .form-input {
      display: flex;
      flex-direction: column;
      border-left: 5px solid var(--text-color);
      padding-left: 1em;
      border-radius: 5px;

      &::before {
        content: '';
        display: block;
        width: 5px;
        height: 100%;
        background-color: white;
        border-radius: 15px;
        opacity: .5;
      }

      label {
        font-weight: bold;
        font-size: 1.2em;
        margin-bottom: 0.25em;
      }

      span {
        color: var(--muted-color);
        margin-bottom: 0.5em;
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
    }

    .form-save {
      display: flex;
      gap: 1em;
      margin-top: 1em;

      ${theme.query.minDesktop} {
        max-width: 300px;
      }

      button {
        border: none;
        display: flex;
        gap: .5em;
        padding: .6em .8em;
        cursor: pointer;
        border-radius: 20px;
        width: 100%;
        font-weight: bold;
        font-size: 1em;
        align-items: center;
        ${scaleOnHover}
      }
    }
  `
}

function Settings() {
  const { settings, setValue } = useSettings()

  const [nodeEnpoint, setNodeEndpoint] = useState(() => {
    return settings[settingsKeys.NODE_WS_ENDPOINT]
  })

  const languages = useMemo(() => {
    return [
      { key: `en`, text: `English` },
      { key: `fr`, text: `French` },
      { key: `es`, text: `Spanish` }
    ]
  }, [])

  return <div className={style.container}>
    <PageTitle title="Settings" subtitle="This page allows you to change explorer settings."
      metaDescription="Set your preferences, manage notifications and other controls." />
    <div className="form-items">
      <div className="form-input">
        <label>Node Endpoint</label>
        <span>Enter the websocket connection endpoint of a XELIS node. Usually, `wss://ip:port/ws` depending on the server configuration.</span>
        <input type="text" value={nodeEnpoint} onChange={(e) => {
          setNodeEndpoint(e.target.value)
        }} placeholder="wss://127.0.0.1/ws" />
        <div className="form-save">
          <Button icon="circle" onClick={() => {
            setNodeEndpoint(defaultSettings[settingsKeys.NODE_WS_ENDPOINT])
          }}>Reset</Button>
          <Button icon="floppy-disk" onClick={() => {
            setValue(settingsKeys.NODE_WS_ENDPOINT, nodeEnpoint)
          }}>Apply</Button>
        </div>
      </div>
      <div className="form-input">
        <label>Language</label>
        <span>Select your prefered language.</span>
        <Dropdown items={languages} defaultKey={`en`} size={1.2} />
      </div>
    </div>
  </div>
}

export default Settings