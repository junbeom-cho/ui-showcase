import { useEffect, useState } from 'react'

export type Route =
  | { page: 'overview' }
  | { page: 'component'; id: string }
  | { page: 'styles' }
  | { page: 'style'; id: string }
  | { page: 'animations' }
  | { page: 'animation'; id: string }

/**
 * `#/styles` → design-style index, `#/style/<id>` → style page,
 * `#/animations` → animation index, `#/animation/<id>` → animation page,
 * `#/<id>` → component page, anything else (``, `#`, `#/`, `#top`) → overview.
 */
export function parseRoute(hash: string): Route {
  const h = hash.trim()
  if (/^#\/styles\/?$/.test(h)) return { page: 'styles' }
  const style = /^#\/style\/([a-z0-9-]+)\/?$/.exec(h)
  if (style) return { page: 'style', id: style[1] }
  if (/^#\/animations\/?$/.test(h)) return { page: 'animations' }
  const animation = /^#\/animation\/([a-z0-9-]+)\/?$/.exec(h)
  if (animation) return { page: 'animation', id: animation[1] }
  const component = /^#\/([a-z0-9-]+)\/?$/.exec(h)
  return component ? { page: 'component', id: component[1] } : { page: 'overview' }
}

export function hrefFor(id: string | null): string {
  return id ? `#/${id}` : '#/'
}

export function styleHref(id: string | null): string {
  return id ? `#/style/${id}` : '#/styles'
}

export function animationHref(id: string | null): string {
  return id ? `#/animation/${id}` : '#/animations'
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
