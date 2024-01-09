import type { int } from './shared'
import { floor } from './shared'

export const ByteMode = {
  bits: 0x4,
  charCount: [8, 16, 16],
  numCharCountBits(ver: int): int {
    return this.charCount[floor((ver + 7) / 17)]
  },
} as const

export type Mode = typeof ByteMode
