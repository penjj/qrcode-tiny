import { ceil, round } from './shared'

const baseOption = {
  width: 200,
  height: 200,
  dark: '#000',
  light: '#fff',
}

export async function draw(modules: boolean[][], option: any) {
  const {
    width,
    height,
    dark = baseOption.dark,
    light = baseOption.light,
  } = Object.assign({}, baseOption, option)
  const len = modules.length
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d')!
  const itemWidth = width / len
  const itemHeight = height / len
  const roundedWidth = round(itemWidth)
  const roundedHeight = round(itemHeight)
  modules.forEach((row, rowIndex) => {
    row.forEach((isDark, colIndex) => {
      const colorStyle = isDark ? dark : light
      const nLeft = colIndex * itemWidth
      const nTop = rowIndex * itemHeight
      context.strokeStyle = colorStyle
      context.fillStyle = colorStyle
      context.fillRect(nLeft, nTop, itemWidth, itemHeight)
      context.strokeRect(
        ceil(nLeft) - 0.5,
        ceil(nTop) - 0.5,
        roundedWidth,
        roundedHeight,
      )
    })
  })

  const blob = await canvas.convertToBlob()
  return URL.createObjectURL(blob)
}
