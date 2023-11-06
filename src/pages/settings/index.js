import { css } from 'goober'
import { useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'

import useSettings, { defaultSettings, settingsKeys } from '../../hooks/useSettings'
import theme from '../../style/theme'
import Button from '../../components/button'
import { scaleOnHover } from '../../style/animate'
import PageTitle from '../../layout/page_title'
import ThemeDropdown from './theme_dropdown'
import LangDropdown from './lang_dropdown'

const style = {
  container: css`
    .form-items {
      display: flex;
      gap: 3em;
      flex-direction: column;
      margin-top: 2em;
    }

    .form-input {
      display: flex;
      flex-direction: column;
      position: relative;
      margin-left: 1em;

      &::before {
        content: '';
        display: block;
        position: absolute;
        width: .3em;
        height: 100%;
        background-color: ${theme.apply({ xelis: `rgb(255 255 255 / 25%)`, dark: `rgb(241 241 241)`, light: `rgb(28 28 28)` })};
        border-radius: .5em;
        left: -1em;
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
        border-radius: .5em;
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
        border-radius: 1em;
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
  const { t } = useLang()

  const [nodeEnpoint, setNodeEndpoint] = useState(() => {
    return settings[settingsKeys.NODE_WS_ENDPOINT]
  })

  return <div className={style.container}>
    <PageTitle title={t('Settings')} subtitle={t('This page allows you to change explorer settings.')}
      metaDescription={t('Set your preferences, manage notifications and other controls.')} />
    <div className="form-items">
      <div className="form-input">
        <label>{t('Node Endpoint')}</label>
        <span>{t('Enter the websocket connection endpoint of a XELIS node. Usually, `wss://ip:port/ws` depending on the server configuration.')}</span>
        <input type="text" value={nodeEnpoint} onChange={(e) => {
          setNodeEndpoint(e.target.value)
        }} placeholder="wss://127.0.0.1/ws" />
        <div className="form-save">
          <Button icon="circle" onClick={() => {
            setNodeEndpoint(defaultSettings[settingsKeys.NODE_WS_ENDPOINT])
          }}>{t('Reset')}</Button>
          <Button icon="floppy-disk" onClick={() => {
            setValue(settingsKeys.NODE_WS_ENDPOINT, nodeEnpoint)
          }}>{t('Apply')}</Button>
        </div>
      </div>
      <div className="form-input">
        <label>{t('Language')}</label>
        <span>{t('Select your preferred language.')}</span>
        <LangDropdown size={1.2} />
      </div>
      <div className="form-input">
        <label>{t('Theme')}</label>
        <span>{t('Select your preferred theme.')}</span>
        <ThemeDropdown size={1.2} />
      </div>
    </div>
  </div>
}

export default Settings