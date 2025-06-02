import transformPixels from '../src/transformPixels'
import { transformPixelsDefault } from '../src/options'
import { bypassScalerTransformationClassName, browserFontSizeDiffVarName } from '../src/constants'
import getResponsiveScript from '../src/script'

describe('transformPixels', () => {
  const css = `
    table {
      padding: 8px;
    }
    .container {
      font-size: 12px;
    }
    .mb-4[data-v-52e31af2] {
      margin-bottom: 16px;
    }
  `
  const transformations = `table:not(.${bypassScalerTransformationClassName}){padding:0.5000rem}.container:not(.${bypassScalerTransformationClassName}){font-size:calc(0.7500rem + var(${browserFontSizeDiffVarName}))}.mb-4[data-v-52e31af2]:not(.${bypassScalerTransformationClassName}){margin-bottom:1rem}`
  const result = transformPixels(transformPixelsDefault, css)
  test('creates correct transformations', () => {
    expect(result).toBe(transformations)
  })
})