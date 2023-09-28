import { css } from 'goober'
import { useNodeSocket } from '@xelis/sdk/react/context'

import DotLoading from '../dotLoading'

const style = {
  container: css`
    border-radius: 20px;
    padding: .5em 1em;
    text-transform: uppercase;
    font-size: .9em;
    font-weight: bold;
    background-color: var(--text-color);
    color: var(--bg-color);
    user-select: none;
  
    > div {
      display: flex;
      gap: .5em;
      align-items: center;

      > :nth-child(1) {
        width: 10px;
        height: 10px;
        border-radius: 15px;
  
        &.alive {
          background-color: var(--success-color);
        }
  
        &.loading {
          background-color: var(--bg-color);
        }
  
        &.error {
          background-color: var(--error-color);
        }
      }
  
      :nth-child(2) {
        margin-top: 3px;
      }
    }
  `
}

function NodeStatus() {
  const nodeSocket = useNodeSocket()

  return <div className={style.container}>
    {(() => {
      if (nodeSocket.loading) {
        return <div>
          <div className="loading" />
          <div>Connecting<DotLoading /></div>
        </div>
      }

      if (!nodeSocket.connected) {
        return <div onClick={() => location.reload()} style={{ cursor: 'pointer' }} title="Click to reload">
          <div className="error" />
          <div>Disconnected</div>
        </div>
      }

      return <div>
        <div className="alive" />
        <div>Connected</div>
      </div>
    })()}
  </div>
}


export default NodeStatus
