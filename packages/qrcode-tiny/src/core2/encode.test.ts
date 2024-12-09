import { expect, it } from 'vitest'
import { findMinVersion } from './encode'

it('find min version', () => {
  expect(findMinVersion(10, [0, 10, 20, 30, 40, 50, 60, 70])).equal(1)
  expect(findMinVersion(10, [-40, -30, -20, -10, 0, 9, 19])).equal(5)
  expect(findMinVersion(10, [29, 39, 49, 59, 69, 79, 89])).equal(0)
  expect(findMinVersion(89, [29, 39, 49, 59, 69, 79, 89])).equal(6)

  expect(() => findMinVersion(1000, [99])).toThrow(RangeError)
})
