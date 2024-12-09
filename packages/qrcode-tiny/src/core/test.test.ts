import { expect, it } from 'vitest'
import { EccHigh } from '..'
import { encodeText as original } from './qrcode'
import { encodeText } from './test'

it('should match snapshot', () => {
  original('Hello 你好', EccHigh)
  const newOne = encodeText('Hello 你好', EccHigh)
  expect(newOne).toMatchSnapshot()
})
