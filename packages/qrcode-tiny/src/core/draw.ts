import { ceil, round } from './shared'

interface DrawOptions {
  size?: number
  dark?: string
  light?: string
}

const baseOption: Required<DrawOptions> = {
  size: 200,
  dark: '#000',
  light: '#fff',
}

export async function draw(modules: boolean[][], option: DrawOptions = {}) {
  const {
    size,
    dark = baseOption.dark,
    light = baseOption.light,
  } = Object.assign({}, baseOption, option)
  const len = modules.length
  const canvas = new OffscreenCanvas(size, size)
  const context = canvas.getContext('2d')!
  const itemSize = size / len
  const roundedSize = round(itemSize)
  modules.forEach((row, rowIndex) => {
    row.forEach((isDark, colIndex) => {
      const colorStyle = isDark ? dark : light
      const nLeft = colIndex * itemSize
      const nTop = rowIndex * itemSize
      context.strokeStyle = colorStyle
      context.fillStyle = colorStyle
      context.fillRect(nLeft, nTop, itemSize, itemSize)
      context.strokeRect(
        ceil(nLeft) - 0.5,
        ceil(nTop) - 0.5,
        roundedSize,
        roundedSize,
      )
    })
  })

  const blob = await canvas.convertToBlob()
  return URL.createObjectURL(blob)
}
