import { css } from 'goober'
import { useNodeSocket, INITIATING } from '@xelis/sdk/react/daemon'
import WebSocket from 'isomorphic-ws'
import { useLang } from 'g45-react/hooks/useLang'

import DotLoading from '../components/dotLoading'
import useSettings from '../hooks/useSettings'
import { settingsKeys } from '../settings'
import theme from '../style/theme'

const style = {
  container: css`
    display: flex;
  `,
  status: css`
    display: inline-flex;
    gap: .5em;
    align-items: center;
    padding: .5em 1em;
    text-transform: uppercase;
    font-size: .9em;
    font-weight: bold;
    background-color: var(--text-color);
    color: var(--bg-color);
    border-radius: 1em;

    ${theme.query.minDesktop} {
      border-radius: 0;
      border-top-left-radius: 1em;
      border-bottom-left-radius: 1em;
    }
  `,
  endpoint: css`
    padding: .5em 1em;
    border-top-right-radius: 1em;
    border-bottom-right-radius: 1em;
    background: var(--content-bg-color);
    color: var(--muted-color);
    display: none;

    ${theme.query.minDesktop} {
      display: block;
    }
  `,
  dot: {
    container: css`
      width: 10px;
      height: 10px;
      border-radius: 50%;
    `,
    connected: css`
      background-color: var(--success-color);
    `,
    connecting: css`
      background-color: var(--bg-color);
    `,
    error: css`
      background-color: var(--error-color);
    `
  },
}

function NodeStatus() {
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const { daemon, readyState } = nodeSocket
  const { connectionTries, maxConnectionTries } = daemon
  const { settings } = useSettings()
  const endpoint = settings[settingsKeys.NODE_WS_ENDPOINT]

  let status = <div className={style.status}>
    <div className={`${style.dot.container} ${style.dot.connected}`} />
    <div>{t('Connected')}</div>
  </div>

  if (readyState === WebSocket.CONNECTING || readyState === INITIATING) {
    let text = t(`Connecting`)
    if (connectionTries > 0) {
      text = t(`Reconnecting ({})`, [connectionTries])
    }

    status = <div className={style.status}>
      <div className={`${style.dot.container} ${style.dot.connecting}`} />
      <div>{text}<DotLoading /></div>
    </div>
  }

  if (readyState === WebSocket.CLOSED || readyState === WebSocket.CLOSING) {
    status = <div onClick={() => location.reload()} className={style.status} style={{ cursor: 'pointer' }}
      title={t('Click to reload.')}>
      <div className={`${style.dot.container} ${style.dot.error}`} />
      <div>{t('Disconnected')}</div>
    </div>
  }

  return <div className={style.container}>
    {status}
    <div className={style.endpoint}>{endpoint}</div>
  </div>
}


export default NodeStatus
