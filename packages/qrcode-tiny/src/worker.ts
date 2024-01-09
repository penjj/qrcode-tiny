import { createQrCode } from '.'

addEventListener('message', async (e) => {
  try {
    const { text, ecc, option } = e.data
    const result = await createQrCode(text, ecc, option)
    postMessage({
      type: 'success',
      data: result,
    })
  }
  catch (e) {
    postMessage({
      type: 'failed',
      data: e,
    })
  }
})
