import { useEffect } from 'react'

/**
 * While a style page is open, the whole document (header, sidebar, and overlays
 * portalled to <body>) wears that style; everywhere else stays default (D-018).
 * The style goes on <html> as data-design-style, which the style CSS scopes to.
 */
export function usePageStyle(styleId: string | null) {
  useEffect(() => {
    if (!styleId) return
    const root = document.documentElement
    root.dataset.designStyle = styleId
    return () => {
      delete root.dataset.designStyle
    }
  }, [styleId])
}
