import { type Ecc, EccHigh } from './core/constants'
import { draw } from './core/draw'
import { encodeText } from './core/qrcode'

export {
  EccHigh,
  EccLow,
  EccMedium,
  EccQuartile,
} from './core/constants'

export interface InlineConfig {
  text: string
  ecc?: Ecc
  width?: number
  height?: number
  light?: string
  dark?: string
}

export function createQrCode(text: string, ecc = EccHigh, option: any) {
  const modules = encodeText(text, ecc)
  return draw(modules, option)
}
