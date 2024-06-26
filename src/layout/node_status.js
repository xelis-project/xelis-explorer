import { css } from 'goober'
import { useNodeSocket, INITIATING } from '@xelis/sdk/react/daemon'
import WebSocket from 'isomorphic-ws'
import { useLang } from 'g45-react/hooks/useLang'
import { Link } from 'react-router-dom'

import DotLoading from '../components/dotLoading'
import theme from '../style/theme'
import useSettings from '../hooks/useSettings'
import { settingsKeys } from '../settings'

const style = {
  container: css`
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    transition: .25s all;
    width: 100%;
    max-width: 25em;
    display: flex;
    flex-direction: column;
    align-items: center;

    ${theme.query.maxMobile} {
      padding-top: 0;

      > div > :nth-child(1) {
        border-radius: 10px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        transform: scale(.9);
      }
    }
  `,
  status: css`
    display: flex;
    gap: .5em;
    align-items: center;
    border-bottom-left-radius: 1em;
    border-bottom-right-radius: 1em;
    padding: .5em 1em;
    text-transform: uppercase;
    font-size: .9em;
    font-weight: bold;
    background-color: var(--text-color);
    color: var(--bg-color);
    user-select: none;
    box-shadow: 0 0 20px 0px rgb(0 0 0 / 20%);
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
  disconnect: css`
    background-color: var(--text-color);
    color: var(--bg-color);
    padding: 1em;
    border-radius: .5em;
    max-width: 35em;
    display: flex;
    flex-direction: column;
    position: relative;
    margin: 1.5em 1em 1em 1em;
    box-shadow: 0 0 20px 0px rgb(0 0 0 / 20%);
    gap: .75em;

    &:before {
      content: "";
      border-left: 11px solid transparent;
      border-right: 11px solid transparent;
      border-bottom: 15px solid var(--text-color);
      position: absolute;
      top: -14px;
      left: 50%;
      margin-left: -11px;
    }
  `,
  endpoint: css`
    padding: .5em;
    background: var(--bg-color);
    color: var(--muted-color);
  `
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
    status = <>
      <div onClick={() => location.reload()} className={style.status} style={{ cursor: 'pointer' }}
        title={t('Click to reload.')}>
        <div className={`${style.dot.container} ${style.dot.error}`} />
        <div>{t('Disconnected')}</div>
      </div>
      <div className={style.disconnect}>
        <div>
          {t(`Despite multiple reconnection attempts, the client was unable to establish a successful connection.`)}
        </div>
        <div className={style.endpoint}>{endpoint}</div>
        <div>{t(`Reload the page or go to`)}&nbsp;<Link to="/settings">{t(`Settings`)}</Link>&nbsp;{t(`to change the endpoint.`)}</div>
      </div>
    </>
  }

  return <div className={style.container}>
    {status}
  </div>
}


export default NodeStatus
