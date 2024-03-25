import { useCallback } from 'react'
import Icon from 'g45-react/components/fontawesome_icon'
import { useLang } from 'g45-react/hooks/useLang'
import { QRCodeCanvas } from 'qrcode.react'
import { css } from 'goober'

import { reduceText } from '../../utils'
import useTheme from '../../hooks/useTheme'
import Hashicon from '../../components/hashicon'
import Modal from '../../components/modal'

const style = {
  container: css`
    background-color: var(--table-td-bg-color);
    border-radius: .5em;
    padding: 1em;

    .title {
      font-size: 1.6em;
      margin-bottom: .25em;
      text-align: center;
    }

    .addr {
      display: flex;
      gap: .5em;
      color: var(--muted-color);
      font-size: 1.2em;
      margin-bottom: 1em;
      align-items: center;
      justify-content: center;
    }

    .copy {
      cursor: pointer;
    }
  `
}

function AddressQRCodeModal(props) {
  const { addr, visible, setVisible } = props

  const { theme: currentTheme } = useTheme()
  const { t } = useLang()

  const copyAddr = useCallback(() => {
    navigator.clipboard.writeText(addr)
  }, [addr])

  return <Modal visible={visible} setVisible={setVisible}>
    <div className={style.container}>
      <div className="title">{t(`Address QR code`)}</div>
      <div className="addr">
        <Hashicon value={addr} size={25} />
        <div>{reduceText(addr)}</div>
        <Icon name="copy" className="copy" onClick={copyAddr} />
      </div>
      <div className="qrcode">
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