import { QrCode } from '@qrcode-tiny/react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('app')!)
  .render(<QrCode text="hello react!" width={200} height={200} />)
