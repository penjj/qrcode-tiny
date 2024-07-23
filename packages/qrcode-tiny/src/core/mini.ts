const MIN_VERSION = 1
const MAX_VERSION = 40

export const ECC_LOW = 0
export const ECC_MEDIUM = 1
export const ECC_QUARTILE = 2
export const ECC_HIGH = 3

const NUMERIC_MODE = 1
const ALPHANUMERIC_MODE = 2
const BYTE_MODE = 4
const KANJI_MODE = 8

function getMaxBytes(version: number) {
  return (version - 1) * 4 + 21
}

function encodeText(text = '') {
  const bytes: number[] = [];
  [...text].forEach((char) => {
    const code = encodeURI(char)
    if (code === char) {
      bytes.push(char.charCodeAt(0))
    }
    else {
      code.split('%').filter(Boolean).forEach((hex) => {
        bytes.push(Number.parseInt(hex, 16))
      })
    }
  })

  return createBitmap(bytes.map(toBytes).flat())
}

function toBytes(num: number, bits = 8) {
  return [...num.toString(2).padStart(bits, '0')].map(Number)
}

function createBitmap(bytes: number[]) {
  const charsLen = bytes / 8
  const bits = [
    ...toBytes(BYTE_MODE, 4),
    ...toBytes(bytes.length, 8),
    ...bytes,
  ]

  // 填充终止符，至少 4个0，如果填充后，不满足8的倍数，继续交替填充 11101100 00010001
  bits.push(
    ...toBytes(0, Math.min(4, dataCapacityBits - charsLen)),
  )
  console.log(bits)
}

encodeText('你好')
