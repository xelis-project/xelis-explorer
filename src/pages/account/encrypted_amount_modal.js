import Icon from 'g45-react/components/fontawesome_icon'
import { useMemo, useState } from 'react'
import { useLang } from 'g45-react/hooks/useLang'

import Modal from '../../components/modal'
import style from './style'

function EncryptedAmountModal(props) {
  const { title, commitment } = props
  const [visible, setVisible] = useState()
  const { t } = useLang()

  const hexCommitment = useMemo(() => {
    return (commitment || []).map((bytes) => {
      return bytes.toString(16)
    })
  }, [commitment])

  return <>
    <button className={style.amountModal.button} onClick={() => setVisible(true)}>
      <Icon name="lock" />
      <div>{t(`Encrypted`)}</div>
    </button>
    <Modal visible={visible} setVisible={setVisible}>
      <div className={style.amountModal.container}>
        <div className={style.amountModal.title}>{title}</div>
        <div className={style.amountModal.value}>{hexCommitment}</div>
      </div>
    </Modal>
  </>
}

export default EncryptedAmountModal