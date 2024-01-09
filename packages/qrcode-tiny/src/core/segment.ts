/* ---- Data segment class ---- */

import type { Mode } from './mode'
import type { bit, int } from './shared'
import { _RangeError } from './shared'

/*
 * A segment of character/binary/control data in a QR Code symbol.
 * Instances of this class are immutable.
 * The mid-level way to create a segment is to take the payload data
 * and call a static factory function such as QrSegment.makeNumeric().
 * The low-level way to create a segment is to custom-make the bit buffer
 * and call the QrSegment() constructor with appropriate values.
 * This segment class imposes no length restrictions, but QR Codes have restrictions.
 * Even in the most favorable conditions, a QR Code can only hold 7089 characters of data.
 * Any segment longer than this is meaningless for the purpose of generating QR Codes.
 */
export function createSegment(mode: Mode, numChars: int, bitData: bit[]) {
  if (numChars < 0)
    throw new _RangeError('Invalid argument')
  return {
    mode,
    numChars,
    getData() {
      return bitData.slice()
    },
  }
}

export type QrSegment = ReturnType<typeof createSegment>
