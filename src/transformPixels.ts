import { TransformPixelsOptions } from './types'
import { htmlTagBaseFontSize, bypassScalerTransformationClassName, browserFontSizeDiffVarName } from './constants'

const pxToRemRegExp = /(\d+)px/g
const cssSelectorRegExp = /([^{]+?)\s*\{([^}]+?)\}/g
const propRegex = /([\w-]+)\s*:\s*([^}]+)/g

function getRemValue(value: number) {
  return (value / htmlTagBaseFontSize).toFixed(4).replace(/[.,]0+$/, "")
}

function getPropertyRemValue(value: string) {
  return value.replace(/[0-9]+px/g, (match: string) => {
    return getRemValue(Number(match.replace('px', ''))) + 'rem'
  })
}

export default (options: TransformPixelsOptions, code: string) => {
  const cssMap = new Map()
  let match

  const curatedCode = code.replace(/\\n/g, '')
  while ((match = cssSelectorRegExp.exec(curatedCode)) !== null) {
    const selector = match[1].trim()
    const propValue = match[2].trim()

    if (!selector || options.ignoreSelectors.some(i => selector.includes(i))) {
      continue
    }

    const pxProperties: { key: string, value: string }[] = []
    const properties = propValue.split(';')
    properties.filter(i => i).forEach((property) => {
      const arr = property.split(':')
      const key = arr[0].trim()
      const value = (arr[1] || '').trim()
      if (value && value !== '0' && value.includes('px') && !options.ignoreAttributes.includes(key)) {
        pxProperties.push({ key, value })
      }
    })

    if (pxProperties.length > 0) {
      cssMap.set(selector, pxProperties)
    }
  }

  let transformationDefinitions = ''

  if (cssMap.size > 0) {
    cssMap.forEach((properties, key) => {
      transformationDefinitions += `${key}:not(.${bypassScalerTransformationClassName}){`
      properties.forEach((prop: { key: string, value: string }, index: number) => {
        const isLast = index === properties.length - 1
        const isFontSizeKey = ['fontSize', 'font-size'].includes(prop.key)
        let propValue = getPropertyRemValue(prop.value)
        if (isFontSizeKey) {
          propValue = `calc(${getPropertyRemValue(prop.value)} + var(${browserFontSizeDiffVarName}))`
        }
        transformationDefinitions += `${prop.key}:${propValue}${isLast ? '' : ';'}`
      })
      transformationDefinitions += '}'
    })
  }

  return transformationDefinitions
}