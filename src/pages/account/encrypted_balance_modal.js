import Icon from 'g45-react/components/fontawesome_icon'
import { css } from 'goober'
import { useMemo, useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'

import Modal from '../../components/modal'

const style = {
  button: css`
    border: thin solid var(--text-color);
    background: transparent;
    padding: .5em;
    border-radius: .5em;
    cursor: pointer;
    color: var(--text-color);
    display: flex;
    gap: .5em;
    align-items: center;
  `,
  balanceModal: css`
    background-color: var(--table-td-bg-color);
    border-radius: .5em;
    padding: 1em;

    .title {
      font-size: 1.6em;
      margin-bottom: .25em;
      text-align: center;
    }

    .value {
      word-break: break-all;
      color: var(--muted-color);
    }
  `
}

function EncryptedBalanceModal(props) {
  const { commitment } = props
  const [visible, setVisible] = useState()
  const { t } = useLang()

  const hexCommitment = useMemo(() => {
    return (commitment || []).map((bytes) => {
      return bytes.toString(16)
    })
  }, [commitment])

  return <>
    <button className={style.button} onClick={() => setVisible(true)}>
      <Icon name="lock" />
      <div>{t(`Encrypted`)}</div>
    </button>
    <Modal visible={visible} setVisible={setVisible}>
      <div className={style.balanceModal}>
        <div className="title">Balance</div>
        <div className="value">{hexCommitment}</div>
      </div>
    </Modal>
  </>
}

export default EncryptedBalanceModal