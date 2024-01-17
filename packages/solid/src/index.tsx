import { type VoidComponent, createEffect, createSignal, onCleanup } from 'solid-js'
import { type InlineConfig, createQrCode } from 'qrcode-tiny'

const QrCode: VoidComponent<InlineConfig> = ({
  text,
  ecc,
  ...option
}) => {
  const [src, setSrc] = createSignal<string>()
  createQrCode(text, ecc, option).then((src) => {
    setSrc(src)
  })
  createEffect(() => {
    let isMounted = true

    createQrCode(text, ecc, option).then((src) => {
      if (isMounted)
        setSrc(src)
    })
    onCleanup(() => {
      isMounted = false
    })
  })

  return <img src={src()} alt="Scan me" />
}

export default QrCode
