/**
 * These codes are refactored from qr-code-generator-ts and come with an license
 */

import type { QrSegment } from './segment.ts'
import type {
  bit,
  byte,
  int,
} from './shared.ts'
/*
 * QR Code generator library (TypeScript)
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */
import {
  type Ecc,
  EccHigh,
  EccMedium,
  EccQuartile,
  MAX_VERSION,
  MIN_VERSION,
  PENALTY_N1,
  PENALTY_N2,
  PENALTY_N3,
  PENALTY_N4,
} from './constants.ts'
import { ByteMode } from './mode.ts'
import { createSegment } from './segment.ts'
import {
  _RangeError,
  abs,
  ceil,
  floor,
  max,
  min,
  parseInt,
  POSITIVE_INFINITY,
} from './shared.ts'
import { appendBits, assert, getBit } from './utils.ts'

// 返回一个以给定纠错级别表示给定的 Unicode 文本字符串的 QR Code。
// 作为保守的上限，如果使用低纠错级别，此函数保证对具有 738 个或更少的 Unicode 代码点（而不是 UTF-16 代码单元）的字符串成功。
// 输出将自动选择最小可能的 QR Code 版本。如果不增加版本，结果的纠错级别可能高于 ecl 参数。
export function encodeText(text: string, ecl: Ecc) {
  return encodeSegments(makeSegments(text), ecl).modules
}

// 返回一个新的可变列表，其中包含零个或多个段，以表示给定的 Unicode 文本字符串。
// 结果可能使用不同的段模式和切换模式，以优化比特流的长度。
export function makeSegments(text: string) {
  // Select the most efficient segment encoding automatically
  if (text === '')
    return []
  return [makeBytes(toUtf8ByteArray(text))]
}

export function makeBytes(data: Readonly<Array<byte>>) {
  const bb: Array<bit> = []
  data.forEach(b => appendBits(b, 8, bb))
  return createSegment(ByteMode, data.length, bb)
}

// Returns a new array of bytes representing the given string encoded in UTF-8.
export function toUtf8ByteArray(str: string): Array<byte> {
  str = encodeURI(str)
  const result: Array<byte> = []
  for (let i = 0; i < str.length; i++) {
    if (str.charAt(i) !== '%') { result.push(str.charCodeAt(i)) }
    else {
      result.push(parseInt(str.substring(i + 1, i + 3), 16))
      i += 2
    }
  }
  return result
}

// (Package-private) Calculates and returns the number of bits needed to encode the given segments at
// the given version. The result is infinity if a segment has too many characters to fit its length field.
function getTotalBits(segs: Readonly<Array<QrSegment>>, version: int): number {
  let result: number = 0
  for (const seg of segs) {
    const ccbits: int = seg.mode.numCharCountBits(version)
    if (seg.numChars >= 1 << ccbits)
      return POSITIVE_INFINITY // The segment's length doesn't fit the field's bit width
    result += 4 + ccbits + seg.getData().length
  }
  return result
}

export function encodeSegments(
  segs: Readonly<Array<QrSegment>>,
  ecl: Ecc,
  minVersion: int = 1,
  maxVersion: int = 40,
  mask: int = -1,
  boostEcl: boolean = true,
) {
  if (
    !(
      MIN_VERSION <= minVersion
      && minVersion <= maxVersion
      && maxVersion <= MAX_VERSION
    )
    || mask < -1
    || mask > 7
  ) {
    throw new _RangeError('Invalid value')
  }

  // Find the minimal version number to use
  let version: int
  let dataUsedBits: int
  for (version = minVersion; ; version++) {
    const dataCapacityBits: int = getNumDataCodewords(version, ecl) * 8 // Number of data bits available
    const usedBits: number = getTotalBits(segs, version)
    if (usedBits <= dataCapacityBits) {
      dataUsedBits = usedBits
      break // This version number is found to be suitable
    }
    if (version >= maxVersion)
      // All versions in the range could not fit the given data
      throw new _RangeError('Data too long')
  }

  // 需要编码的数据超出上限，提升纠错等级
  // Increase the error correction level while the data still fits in the current version number
  for (const newEcl of [EccMedium, EccQuartile, EccHigh]) {
    // From low to high
    if (boostEcl && dataUsedBits <= getNumDataCodewords(version, newEcl) * 8)
      ecl = newEcl
  }

  // Concatenate all segments to create the data bit string
  const bb: Array<bit> = []
  for (const seg of segs) {
    appendBits(seg.mode.bits, 4, bb)
    appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb)
    for (const b of seg.getData()) bb.push(b)
  }
  assert(bb.length === dataUsedBits)

  // Add terminator and pad up to a byte if applicable
  const dataCapacityBits: int = getNumDataCodewords(version, ecl) * 8
  assert(bb.length <= dataCapacityBits)
  appendBits(0, min(4, dataCapacityBits - bb.length), bb)
  appendBits(0, (8 - (bb.length % 8)) % 8, bb)
  assert(bb.length % 8 === 0)

  // Pad with alternating bytes until data capacity is reached
  for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
    appendBits(padByte, 8, bb)

  // Pack bits into bytes in big endian
  const dataCodewords: Array<byte> = []
  while (dataCodewords.length * 8 < bb.length) dataCodewords.push(0)
  bb.forEach(
    (b: bit, i: int) => (dataCodewords[i >>> 3] |= b << (7 - (i & 7))),
  )

  // Create the QR Code object
  return createQrCode(version, ecl, dataCodewords, mask)
}

// 返回在给定版本号和纠错级别下，任何 QR Code 中包含的 8 位数据（即非纠错）码字的数量，丢弃剩余的比特位。
// 这个无状态纯函数可以实现为一个（40*4）单元格的查找表。
export function getNumDataCodewords(ver: int, ecl: Ecc): int {
  return (
    floor(getNumRawDataModules(ver) / 8)
    - ecl.perBlocks[ver] * ecl.correctBlocks[ver]
  )
}

// 返回在排除所有功能模块后，可以存储在给定版本号的 QR Code 中的数据位数。
// 这包括剩余的比特位，因此可能不是 8 的倍数。
// 结果范围为 [208, 29648]。这可以实现为一个包含 40 个条目的查找表。
export function getNumRawDataModules(ver: int): int {
  if (ver < MIN_VERSION || ver > MAX_VERSION)
    throw new _RangeError('Version number out of range')
  let result: int = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const numAlign: int = floor(ver / 7) + 2
    result -= (25 * numAlign - 10) * numAlign - 55
    if (ver >= 7)
      result -= 36
  }
  assert(result >= 208 && result <= 29648)
  return result
}

// Returns a Reed-Solomon ECC generator polynomial for the given degree. This could be
// implemented as a lookup table over all possible parameter values, instead of as an algorithm.
function reedSolomonComputeDivisor(degree: int): Array<byte> {
  if (degree < 1 || degree > 255)
    throw new _RangeError('Degree out of range')
  // Polynomial coefficients are stored from highest to lowest power, excluding the leading term which is always 1.
  // For example the polynomial x^3 + 255x^2 + 8x + 93 is stored as the uint8 array [255, 8, 93].
  const result: Array<byte> = []
  for (let i = 0; i < degree - 1; i++) result.push(0)
  result.push(1) // Start off with the monomial x^0

  // Compute the product polynomial (x - r^0) * (x - r^1) * (x - r^2) * ... * (x - r^{degree-1}),
  // and drop the highest monomial term which is always 1x^degree.
  // Note that r = 0x02, which is a generator element of this field GF(2^8/0x11D).
  let root = 1
  for (let i = 0; i < degree; i++) {
    // Multiply the current product by (x - r^i)
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root)
      if (j + 1 < result.length)
        result[j] ^= result[j + 1]
    }
    root = reedSolomonMultiply(root, 0x02)
  }
  return result
}

// Returns the product of the two given field elements modulo GF(2^8/0x11D). The arguments and result
// are unsigned 8-bit integers. This could be implemented as a lookup table of 256*256 entries of uint8.
function reedSolomonMultiply(x: byte, y: byte): byte {
  if (x >>> 8 !== 0 || y >>> 8 !== 0)
    throw new _RangeError('Byte out of range')
  // Russian peasant multiplication
  let z: int = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D)
    z ^= ((y >>> i) & 1) * x
  }
  assert(z >>> 8 === 0)
  return z as byte
}

// Returns the Reed-Solomon error correction codeword for the given data and divisor polynomials.
function reedSolomonComputeRemainder(
  data: Readonly<Array<byte>>,
  divisor: Readonly<Array<byte>>,
): Array<byte> {
  const result: Array<byte> = divisor.map(_ => 0)
  for (const b of data) {
    // Polynomial division
    const factor: byte = b ^ (result.shift() as byte)
    result.push(0)
    divisor.forEach(
      (coef, i) => (result[i] ^= reedSolomonMultiply(coef, factor)),
    )
  }
  return result
}

interface QrContext {
  size?: int
  mask?: int
  modules: boolean[][]
  isFn: boolean[][]
}

export function createQrCode(version: int, ecc: Ecc, dataCodewords: byte[], msk: int) {
  const context: QrContext = {
    modules: [],
    isFn: [],
  }

  // Check scalar arguments
  if (version < MIN_VERSION || version > MAX_VERSION)
    throw new _RangeError('Version value out of range')
  if (msk < -1 || msk > 7)
    throw new _RangeError('Mask value out of range')

  const size = (context.size = version * 4 + 17)

  // Initialize both grids to be size*size arrays of Boolean false
  const row: Array<boolean> = []
  for (let i = 0; i < size; i++) row.push(false)
  for (let i = 0; i < size; i++) {
    context.modules.push(row.slice()) // Initially all light
    context.isFn.push(row.slice())
  }

  function setFunctionModule(x: int, y: int, isDark: boolean): void {
    context.modules[y][x] = isDark
    context.isFn[y][x] = true
  }

  // Draws a 9*9 finder pattern including the border separator,
  // with the center module at (x, y). Modules can be out of bounds.
  function drawFinderPattern(x: int, y: int): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist: int = max(abs(dx), abs(dy)) // Chebyshev/infinity norm
        const xx: int = x + dx
        const yy: int = y + dy
        if (xx >= 0 && xx < size && yy >= 0 && yy < size)
          setFunctionModule(xx, yy, dist !== 2 && dist !== 4)
      }
    }
  }

  // Returns an ascending list of positions of alignment patterns for this version number.
  // Each position is in the range [0,177), and are used on both the x and y axes.
  // This could be implemented as lookup table of 40 variable-length lists of integers.
  function getAlignmentPatternPositions(): Array<int> {
    if (version === 1) { return [] }
    else {
      const numAlign: int = floor(version / 7) + 2
      const step: int
        = version === 32 ? 26 : ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2
      const result: Array<int> = [6]
      for (let pos = size - 7; result.length < numAlign; pos -= step)
        result.splice(1, 0, pos)
      return result
    }
  }

  function drawFunctionPatterns(): void {
    // Draw horizontal and vertical timing patterns
    for (let i = 0; i < size; i++) {
      setFunctionModule(6, i, i % 2 === 0)
      setFunctionModule(i, 6, i % 2 === 0)
    }

    // Draw 3 finder patterns (all corners except bottom right; overwrites some timing modules)
    drawFinderPattern(3, 3)
    drawFinderPattern(size - 4, 3)
    drawFinderPattern(3, size - 4)

    // Draw numerous alignment patterns
    const alignPatPos: Array<int> = getAlignmentPatternPositions()
    const numAlign: int = alignPatPos.length
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        // Don't draw on the three finder corners
        if (
          !(
            (i === 0 && j === 0)
            || (i === 0 && j === numAlign - 1)
            || (i === numAlign - 1 && j === 0)
          )
        ) {
          drawAlignmentPattern(alignPatPos[i], alignPatPos[j])
        }
      }
    }

    // Draws a 5*5 alignment pattern, with the center module
    // at (x, y). All modules must be in bounds.
    function drawAlignmentPattern(x: int, y: int): void {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++)
          setFunctionModule(x + dx, y + dy, max(abs(dx), abs(dy)) !== 1)
      }
    }

    // Draw configuration data
    drawFormatBits(0) // Dummy mask value; overwritten later in the constructor
    drawVersion()
  }

  // Draws two copies of the version bits (with its own error correction code),
  // based on this object's version field, iff 7 <= version <= 40.
  function drawVersion(): void {
    if (version < 7)
      return

    // Calculate error correction code and pack bits
    let rem: int = version // version is uint6, in the range [7, 40]
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25)
    const bits: int = (version << 12) | rem // uint18
    assert(bits >>> 18 === 0)

    // Draw two copies
    for (let i = 0; i < 18; i++) {
      const color: boolean = getBit(bits, i)
      const a: int = size - 11 + (i % 3)
      const b: int = floor(i / 3)
      setFunctionModule(a, b, color)
      setFunctionModule(b, a, color)
    }
  }

  // Draws two copies of the format bits (with its own error correction code)
  // based on the given mask and this object's error correction level field.
  function drawFormatBits(mask: int): void {
    // Calculate error correction code and pack bits
    const data: int = (ecc.formatBit << 3) | mask // errCorrLvl is uint2, mask is uint3
    let rem: int = data
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const bits = ((data << 10) | rem) ^ 0x5412 // uint15
    assert(bits >>> 15 === 0)

    // Draw first copy
    for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getBit(bits, i))
    setFunctionModule(8, 7, getBit(bits, 6))
    setFunctionModule(8, 8, getBit(bits, 7))
    setFunctionModule(7, 8, getBit(bits, 8))
    for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getBit(bits, i))

    // Draw second copy
    for (let i = 0; i < 8; i++)
      setFunctionModule(size - 1 - i, 8, getBit(bits, i))
    for (let i = 8; i < 15; i++)
      setFunctionModule(8, size - 15 + i, getBit(bits, i))
    setFunctionModule(8, size - 8, true) // Always dark
  }

  // Returns a new byte string representing the given data with the appropriate error correction
  // codewords appended to it, based on this object's version and error correction level.
  function addEccAndInterleave(data: Readonly<Array<byte>>): Array<byte> {
    const ver: int = version
    if (data.length !== getNumDataCodewords(ver, ecc))
      throw new _RangeError('Invalid argument')

    // Calculate parameter numbers
    const numBlocks: int = ecc.correctBlocks[ver]
    const blockEccLen: int = ecc.perBlocks[ver]
    const rawCodewords: int = floor(getNumRawDataModules(ver) / 8)
    const numShortBlocks: int = numBlocks - (rawCodewords % numBlocks)
    const shortBlockLen: int = floor(rawCodewords / numBlocks)

    // Split data into blocks and append ECC to each block
    const blocks: Array<Array<byte>> = []
    const rsDiv: Array<byte> = reedSolomonComputeDivisor(blockEccLen)
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat: Array<byte> = data.slice(
        k,
        k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1),
      )
      k += dat.length
      const ecc: Array<byte> = reedSolomonComputeRemainder(dat, rsDiv)
      if (i < numShortBlocks)
        dat.push(0)
      blocks.push(dat.concat(ecc))
    }

    // Interleave (not concatenate) the bytes from every block into a single sequence
    const result: Array<byte> = []
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        // Skip the padding byte in short blocks
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(block[i])
      })
    }
    assert(result.length === rawCodewords)
    return result
  }

  // Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
  // data area of this QR Code. Function modules need to be marked off before this is called.
  function drawCodewords(data: Readonly<Array<byte>>): void {
    if (data.length !== floor(getNumRawDataModules(version) / 8))
      throw new _RangeError('Invalid argument')
    let i: int = 0 // Bit index into the data
    // Do the funny zigzag scan
    for (let right = size - 1; right >= 1; right -= 2) {
      // Index of right column in each column pair
      if (right === 6)
        right = 5
      for (let vert = 0; vert < size; vert++) {
        // Vertical counter
        for (let j = 0; j < 2; j++) {
          const x: int = right - j // Actual x coordinate
          const upward: boolean = ((right + 1) & 2) === 0
          const y: int = upward ? size - 1 - vert : vert // Actual y coordinate
          if (!context.isFn[y][x] && i < data.length * 8) {
            context.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7))
            i++
          }
          // If this QR Code has any remainder bits (0 to 7), they were assigned as
          // 0/false/light by the constructor and are left unchanged by this method
        }
      }
    }
    assert(i === data.length * 8)
  }

  // Can only be called immediately after a light run is added, and
  // returns either 0, 1, or 2. A helper function for getPenaltyScore().
  function finderPenaltyCountPatterns(runHistory: Readonly<Array<int>>): int {
    const n: int = runHistory[1]
    assert(n <= size * 3)
    const core: boolean
      = n > 0
      && runHistory[2] === n
      && runHistory[3] === n * 3
      && runHistory[4] === n
      && runHistory[5] === n
    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0)
      + (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    )
  }

  function applyMask(mask: int): void {
    if (mask < 0 || mask > 7)
      throw new _RangeError('Mask value out of range')
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let invert: boolean
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0
            break
          case 1:
            invert = y % 2 === 0
            break
          case 2:
            invert = x % 3 === 0
            break
          case 3:
            invert = (x + y) % 3 === 0
            break
          case 4:
            invert = (floor(x / 3) + floor(y / 2)) % 2 === 0
            break
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0
            break
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
            break
          case 7:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
            break
          default:
            throw new Error('Unreachable')
        }
        if (!context.isFn[y][x] && invert)
          context.modules[y][x] = !context.modules[y][x]
      }
    }
  }

  // Must be called at the end of a line (row or column) of modules. A helper function for getPenaltyScore().
  function finderPenaltyTerminateAndCount(
    currentRunColor: boolean,
    currentRunLength: int,
    runHistory: Array<int>,
  ): int {
    if (currentRunColor) {
      // Terminate dark run
      finderPenaltyAddHistory(currentRunLength, runHistory)
      currentRunLength = 0
    }
    currentRunLength += size // Add light border to final run
    finderPenaltyAddHistory(currentRunLength, runHistory)
    return finderPenaltyCountPatterns(runHistory)
  }
  // Calculates and returns the penalty score based on state of this QR Code's current modules.
  // This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
  function getPenaltyScore(): int {
    let result: int = 0

    // Adjacent modules in row having same color, and finder-like patterns
    for (let y = 0; y < size; y++) {
      let runColor = false
      let runX = 0
      const runHistory = [0, 0, 0, 0, 0, 0, 0]
      for (let x = 0; x < size; x++) {
        if (context.modules[y][x] === runColor) {
          runX++
          if (runX === 5)
            result += PENALTY_N1
          else if (runX > 5)
            result++
        }
        else {
          finderPenaltyAddHistory(runX, runHistory)
          if (!runColor)
            result += finderPenaltyCountPatterns(runHistory) * PENALTY_N3
          runColor = context.modules[y][x]
          runX = 1
        }
      }
      result
        += finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3
    }
    // Adjacent modules in column having same color, and finder-like patterns
    for (let x = 0; x < size; x++) {
      let runColor = false
      let runY = 0
      const runHistory = [0, 0, 0, 0, 0, 0, 0]
      for (let y = 0; y < size; y++) {
        if (context.modules[y][x] === runColor) {
          runY++
          if (runY === 5)
            result += PENALTY_N1
          else if (runY > 5)
            result++
        }
        else {
          finderPenaltyAddHistory(runY, runHistory)
          if (!runColor)
            result += finderPenaltyCountPatterns(runHistory) * PENALTY_N3
          runColor = context.modules[y][x]
          runY = 1
        }
      }
      result
        += finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3
    }

    // 2*2 blocks of modules having same color
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const color: boolean = context.modules[y][x]
        if (
          color === context.modules[y][x + 1]
          && color === context.modules[y + 1][x]
          && color === context.modules[y + 1][x + 1]
        ) {
          result += PENALTY_N2
        }
      }
    }

    // Balance of dark and light modules
    let dark: int = 0
    for (const row of context.modules)
      dark = row.reduce((sum, color) => sum + (color ? 1 : 0), dark)
    const total: int = size * size // Note that size is odd, so dark/total != 1/2
    // Compute the smallest integer k >= 0 such that (45-5k)% <= dark/total <= (55+5k)%
    const k: int = ceil(abs(dark * 20 - total * 10) / total) - 1
    assert(k >= 0 && k <= 9)
    result += k * PENALTY_N4
    assert(result >= 0 && result <= 2568888) // Non-tight upper bound based on default values of PENALTY_N1, ..., N4
    return result
  }

  // Pushes the given value to the front and drops the last value. A helper function for getPenaltyScore().
  function finderPenaltyAddHistory(
    currentRunLength: int,
    runHistory: Array<int>,
  ): void {
    if (runHistory[0] === 0)
      currentRunLength += size // Add light border to initial run
    runHistory.pop()
    runHistory.unshift(currentRunLength)
  }

  // Compute ECC, draw modules
  drawFunctionPatterns()
  const allCodewords: Array<byte> = addEccAndInterleave(dataCodewords)
  drawCodewords(allCodewords)

  // Do masking
  if (msk === -1) {
    // Automatically choose best mask
    let minPenalty: int = 1000000000
    for (let i = 0; i < 8; i++) {
      applyMask(i)
      drawFormatBits(i)
      const penalty: int = getPenaltyScore()
      if (penalty < minPenalty) {
        msk = i
        minPenalty = penalty
      }
      applyMask(i) // Undoes the mask due to XOR
    }
  }
  assert(msk >= 0 && msk <= 7)
  context.mask = msk
  applyMask(msk) // Apply the final choice of mask
  drawFormatBits(msk) // Overwrite old format bits

  context.isFn = []

  return context
}
