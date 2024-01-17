import { expect, it } from 'vitest'
import { encodeText } from './qrcode'
import { EccHigh, EccLow, EccMedium, EccQuartile } from './constants'

it('should match snapshot', () => {
  expect(encodeText('Hello 你好', EccHigh)).toMatchSnapshot()
  expect(encodeText('Hello 你好', EccQuartile)).toMatchSnapshot()
  expect(encodeText('Hello 你好', EccMedium)).toMatchSnapshot()
  expect(encodeText('Hello 你好', EccLow)).toMatchSnapshot()
  expect(encodeText('', EccLow)).toMatchSnapshot()
})
