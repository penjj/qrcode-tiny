/* eslint-disable eslint-comments/no-duplicate-disable */
/* eslint-disable unused-imports/no-unused-vars */
export function encodeText() {

}

export const VERSION_MIN = 1
export const VERSION_MAX = 40
export const BASIC_BLOCKS = 21

export const { floor } = Math

interface Overlay {
  width: number
  height: number
}

export function applyVersion(data: number[], overlay?: Overlay) {
  return findSuitableVersion()
}

// eslint-disable-next-line eslint-comments/no-duplicate-disable
// eslint-disable-next-line unused-imports/no-unused-vars
function findMinVersion(dataSize: number, versionSizes: number[]) {
  let start = 0
  let end = versionSizes.length - 1
  let lastVersion: number
  while (start <= end) {
    const mid = floor((start + end) / 2)
    if (versionSizes[mid] > dataSize)
      return mid

    if (versionSizes[mid] > dataSize)
      end = mid - 1

    if (versionSizes[mid] < dataSize)
      start = mid + 1
  }
}
