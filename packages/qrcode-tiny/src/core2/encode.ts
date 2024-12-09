export function encodeText() {

}

export const VERSION_MIN = 1
export const VERSION_MAX = 40

export const BASIC_BLOCKS = 21

export const { floor } = Math
export const _RangeError = RangeError

interface Overlay {
  width: number
  height: number
}

// export function applyVersion(data: number[], overlay?: Overlay) {
//   return findMinVersion()
// }

/**
 * find the smallest version that can hold data.
 */
export function findMinVersion(dataSize: number, versionSizes: number[]) {
  let start = 0
  let end = versionSizes.length - 1

  if (dataSize > versionSizes[end])
    throw new _RangeError('Data too large')

  if (dataSize <= versionSizes[0])
    return start

  while (start <= end) {
    const mid = floor((start + end) / 2)
    const midSize = versionSizes[mid]

    if (midSize === dataSize) { return mid }

    else if (midSize > dataSize) {
      end = mid - 1
    }

    else {
      start = mid + 1
      if (versionSizes[start] > dataSize)
        return mid
    }
  }
}

const NUMERIC_MODE = 1
const ALPHANUMERIC_MODE = 2
const BYTE_MODE = 4

export function getEncodeMode(rawText: string) {
  return /^0-9$/.test(rawText)
    ? NUMERIC_MODE
    : /^[A-Z0-9 $%*+\-./:]$/.test(rawText)
      ? ALPHANUMERIC_MODE
      : BYTE_MODE
}

export function encodeData(data: string, mode: number) {
  const bytes = new Uint8Array(data.length)
}

export const EC_LEVEL = {
  l: 1,
  m: 2,
  q: 3,
  h: 4,
}

export function createQRCode(data: string, ecLevel = EC_LEVEL.l) {
  const encodeMode = getEncodeMode(data)
  const bytes = encodeData(data, encodeMode)
  const dataSize = getDataSize(bytes, encodeMode)
  const version = findMinVersion(bytes.length, VERSION_SIZES)
  return toQRBitmap(bytes, dataSize, version)
}

export function applyMask(version: number, data: number[], overlay?: Overlay) {

}
