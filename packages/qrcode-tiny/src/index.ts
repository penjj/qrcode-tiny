import { type Ecc, EccHigh } from './core/constants'
import { draw } from './core/draw'
import { encodeText } from './core/test'

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

export type {
  Ecc,
}

export function createQrCode(text: string, ecc = EccHigh, option: any) {
  const modules = encodeText(text, ecc)
  return draw(modules, option)
}
