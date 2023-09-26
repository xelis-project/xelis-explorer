import { css } from 'goober'

import useNodeSocket from '../../context/useNodeSocket'
import DotLoading from '../dotLoading'

const style = {
  container: css`
    display: flex;
    gap: .5em;
    border-radius: 20px;
    padding: .5em 1em;
    text-transform: uppercase;
    font-size: .9em;
    font-weight: bold;
    background-color: var(--text-color);
    color: var(--bg-color);
    align-items: center;
  
    > :nth-child(1) {
      width: 10px;
      height: 10px;
      border-radius: 15px;

      &.alive {
        background-color: var(--success-color);
      }

      &.loading {
        background-color: var(--muted-color);
      }

      &.error {
        background-color: var(--error-color);
      }
    }

    :nth-child(2) {
      margin-top: 3px;
    }
  `
}

function NodeStatus() {
  const nodeSocket = useNodeSocket()

  return <div className={style.container}>
    {(() => {
      if (nodeSocket.loading) {
        return <>
          <div className="loading" />
          <div>Connecting<DotLoading /></div>
        </>
      }

      if (!nodeSocket.connected) {
        return <>
          <div className="error" />
          <div>Disconnected</div>
        </>
      }

      return <>
        <div className="alive" />
        <div>Connected</div>
      </>
    })()}
  </div>
}


export default NodeStatus
