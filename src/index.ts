import { isValidJsonString } from './utils'
import transformPixels from './transformPixels'
import { TransformPixelsOptions } from './types'
import { transformPixelsDefault } from './options'

import scalerScript from './script'

function transformExistingStyles(shouldTransformPixels: boolean, options: TransformPixelsOptions) {
  let transformations = ''
  Array.from(document.styleSheets).forEach((styleSheet: CSSStyleSheet) => {
    try {
      const cssRules = styleSheet.cssRules
      Array.from(cssRules).forEach((rule) => {
        const transformedRules = transformPixels(shouldTransformPixels, options, rule.cssText)
        if (transformedRules) transformations += transformedRules
      })
    } catch (error) {
      console.warn('Scaler: Could not access stylesheet rules. Pixels transformation failed.', error)
    }
  })
  const style = document.createElement('style')
  style.setAttribute('type', 'text/css')
  style.setAttribute('data-app-scaler-transformations', 'true')
  style.textContent = transformations.replace(/\n/g, '')
  document.head.appendChild(style)
}

function observeNewlyAddedStyles(shouldTransformPixels: boolean, options: TransformPixelsOptions) {
  const cssObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'style') {
            const styleEl = node as HTMLStyleElement
            const css = styleEl.textContent ?? ''
            const transformed = transformPixels(shouldTransformPixels, options, css)
            styleEl.textContent = css + transformed
          }
        })
      }
    }
  })
  cssObserver.observe(document.head, {
    childList: true,
    subtree: true,
  })
}


export default function(transformParams?: 'runtime' | TransformPixelsOptions | boolean) {
  function scaleUI() {
    const htmlElem = document.querySelector('html')
    const transformPixelsAttr = htmlElem?.getAttribute('data-scaler-js-transform-pixels')
    const hasRuntimeOption = transformParams === 'runtime' && transformPixelsAttr != 'false'
    const hasCustomOptions = typeof transformParams === 'object'

    const shouldTransformPixels = hasRuntimeOption || hasCustomOptions || transformParams === true

    let transformPixelsOptions
    if (hasRuntimeOption && transformPixelsAttr && isValidJsonString(transformPixelsAttr)) {
      transformPixelsOptions = Object.assign(transformPixelsDefault, JSON.parse(transformPixelsAttr))
    } else if (hasCustomOptions) {
      transformPixelsOptions = Object.assign(transformPixelsDefault, { ...transformParams })
    } else {
      transformPixelsOptions = transformPixelsDefault
    }
    setTimeout(() => {
      transformExistingStyles(shouldTransformPixels, transformPixelsOptions)
      observeNewlyAddedStyles(shouldTransformPixels, transformPixelsOptions)
    })

    const script = scalerScript()
    const scriptTag = document.createElement('script')
    scriptTag.setAttribute('data-scaler-js-html-font-size-watcher', 'true')
    scriptTag.textContent = script
    document.head.appendChild(scriptTag)
  }

  if (window.document.readyState !== 'loading') {
    scaleUI()
  } else {
    window.document.addEventListener('DOMContentLoaded', function() {
      scaleUI()
    })
  }
}