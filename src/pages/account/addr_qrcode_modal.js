import { useCallback } from 'react'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'
import { QRCodeCanvas } from 'qrcode.react'

import { reduceText } from '../../utils'
import useTheme from '../../hooks/useTheme'
import Hashicon from '../../components/hashicon'
import Modal from '../../components/modal'

import style from './style'

function AddressQRCodeModal(props) {
  const { addr, visible, setVisible } = props

  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  const copyAddr = useCallback(() => {
    navigator.clipboard.writeText(addr)
  }, [addr])

  return <Modal visible={visible} setVisible={setVisible}>
    <div className={style.addrModal.container}>
      <div className={style.addrModal.title}>{t(`Address QR code`)}</div>
      <div className={style.addrModal.addr}>
        <Hashicon value={addr} size={25} />
        <div>{reduceText(addr)}</div>
        <Icon name="copy" className={style.addrModal.copy} onClick={copyAddr} />
      </div>
      <div>
        <QRCodeCanvas value={addr}
          bgColor="transparent"
          fgColor={currentTheme === `light` ? `#000000` : `#ffffff`}
          size={250}
        />
      </div>
    </div>
  </Modal>
}

export default AddressQRCodeModal