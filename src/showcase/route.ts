import { useEffect, useState } from 'react'

export type Route = { page: 'overview' } | { page: 'component'; id: string }

/** `#/badge` → component page, anything else (``, `#`, `#/`, `#top`) → overview. */
export function parseRoute(hash: string): Route {
  const match = /^#\/([a-z0-9-]+)\/?$/.exec(hash.trim())
  return match ? { page: 'component', id: match[1] } : { page: 'overview' }
}

export function hrefFor(id: string | null): string {
  return id ? `#/${id}` : '#/'
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
