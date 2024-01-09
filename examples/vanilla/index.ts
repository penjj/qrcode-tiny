import { createQrCode } from 'qrcode-tiny'

createQrCode('Hello vanilla js!', undefined, {
  dark: '#0f0',
  light: '#f0f',
}).then((qr) => {
  const el = document.querySelector('.qrcode')
  const img = document.createElement('img')
  img.width = 200
  img.height = 200
  img.src = qr

  el?.append(img)
})
