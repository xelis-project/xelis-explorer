import { css } from 'goober'
import { useNodeSocket, INITIATING } from '@xelis/sdk/react/daemon'
import WebSocket from 'isomorphic-ws'

import DotLoading from '../components/dotLoading'
import { useLang } from 'g45-react/hooks/useLang'

const style = {
  container: css`
    display: flex;
    flex-direction: column;
    align-items: center;

    > :nth-child(1) {
      display: flex;
      gap: .5em;
      align-items: center;
      border-radius: 1em;
      padding: .5em 1em;
      text-transform: uppercase;
      font-size: .9em;
      font-weight: bold;
      background-color: var(--text-color);
      color: var(--bg-color);
      user-select: none;
      box-shadow: 0 0 20px 0px rgb(0 0 0 / 20%);

      > :nth-child(1) {
        width: 10px;
        height: 10px;
        border-radius: 50%;
  
        &[data-status="connected"] {
          background-color: var(--success-color);
        }
  
        &[data-status="connecting"] {
          background-color: var(--bg-color);
        }
  
        &[data-status="error"] {
          background-color: var(--error-color);
        }
      }
  
      :nth-child(2) {
        margin-top: 3px;
      }
    }

    > :nth-child(2) {
      background-color: var(--text-color);
      color: var(--bg-color);
      padding: 1em;
      border-radius: .5em;
      max-width: 30em;
      display: flex;
      justify-content: center;
      position: relative;
      margin-top: 1.5em;
      box-shadow: 0 0 20px 0px rgb(0 0 0 / 20%);

      &:before {
        content: "";
        border-left: 11px solid transparent;
        border-right: 11px solid transparent;
        border-bottom: 15px solid var(--text-color);
        position: absolute;
        top: -14px;
      }
    }
  `
}

function NodeStatus() {
  const nodeSocket = useNodeSocket()
  const { t } = useLang()

  const { daemon, readyState } = nodeSocket
  const { connectionTries, maxConnectionTries } = daemon

  return <div className={style.container}>
    {(() => {
      if (readyState === WebSocket.CONNECTING || readyState === INITIATING) {
        let text = t(`Connecting`)
        if (connectionTries > 0) {
          text = t(`Reconnecting ({})`, [connectionTries])
        }

        return <div>
          <div data-status="connecting" />
          <div>{text}<DotLoading /></div>
        </div>
      }

      if (readyState === WebSocket.CLOSED || readyState === WebSocket.CLOSING) {
        return <>
          <div onClick={() => location.reload()} style={{ cursor: 'pointer' }} title={t('Click to reload.')}>
            <div data-status="error" />
            <div>{t('Disconnected')}</div>
          </div>
          {connectionTries >= maxConnectionTries && <div>
            {t(`Despite multiple reconnection attempts, the client was unable to establish a successful connection. Click here to reload and attempt reconnecting to the node manually.`)}
          </div>}
        </>
      }

      return <div>
        <div data-status="connected" />
        <div>{t('Connected')}</div>
      </div>
    })()}
  </div>
}


export default NodeStatus
