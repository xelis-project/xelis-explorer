import { useCallback, useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'

import useSettings from '../../hooks/useSettings'
import { defaultSettings, settingsKeys } from '../../settings'
import Button from '../../components/button'
import PageTitle from '../../layout/page_title'
import ThemeDropdown from './theme_dropdown'
import LangDropdown from './lang_dropdown'
import { useNotification } from '../../components/notifications'

import style from './style'

function Settings() {
  const { settings, setValue } = useSettings()
  const { t } = useLang()
  const { pushNotification } = useNotification()

  const [nodeEnpoint, setNodeEndpoint] = useState(() => {
    return settings[settingsKeys.NODE_WS_ENDPOINT]
  })

  const resetEndpoint = useCallback(() => {
    setNodeEndpoint(defaultSettings[settingsKeys.NODE_WS_ENDPOINT])
    //pushNotification({ icon: `info-circle`, title: t(`Info`), description: t(`The endpoint was reset.`) })
  }, [])

  const applyEndpoint = useCallback(() => {
    setValue(settingsKeys.NODE_WS_ENDPOINT, nodeEnpoint)
    pushNotification({ icon: `info-circle`, title: t(`Info`), description: t(`The new endpoint was saved.`) })
  }, [setValue, nodeEnpoint])

  return <div>
    <PageTitle title={t('Settings')} subtitle={t('This page allows you to change explorer settings.')}
      metaDescription={t('Set your preferences, manage notifications and other controls.')} />
    <div className={style.formItems}>
      <div className={style.formInput}>
        <label>{t('Node Endpoint')}</label>
        <span>
          {t('Enter the websocket connection endpoint of a XELIS node. Usually, `wss://ip:port/json_rpc` depending on the server configuration.')}
        </span>
        <input type="text" value={nodeEnpoint} onChange={(e) => {
          setNodeEndpoint(e.target.value)
        }} placeholder="wss://127.0.0.1/json_rpc" />
        <div className={style.formSave}>
          <Button icon="circle" onClick={resetEndpoint}>
            {t('Reset')}
          </Button>
          <Button icon="floppy-disk" onClick={applyEndpoint}>
            {t('Apply')}
          </Button>
        </div>
      </div>
      <div className={style.formInput}>
        <label>{t('Language')}</label>
        <span>{t('Select your preferred language.')}</span>
        <div style={{ maxWidth: `15em` }}>
          <LangDropdown />
        </div>
      </div>
      <div className={style.formInput}>
        <label>{t('Theme')}</label>
        <span>{t('Select your preferred theme.')}</span>
        <div style={{ maxWidth: `15em` }}>
          <ThemeDropdown />
        </div>
      </div>
    </div>
  </div>
}

export default Settings