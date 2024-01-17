import { type FC, createElement, useEffect, useState } from 'react'
import type { InlineConfig } from 'qrcode-tiny'
import { createQrCode } from 'qrcode-tiny'

const QrCode: FC<InlineConfig> = ({ text, ecc, ...option }) => {
  const [src, setSrc] = useState<string>()

  useEffect(() => {
    createQrCode(text, ecc, option).then(setSrc)
  }, [text, ecc, option])

  return createElement('img', { src })
}

export default QrCode
