const files = import.meta.glob('./styles/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '').trim()

/** Selectors of every style rule, skipping at-rule headers and keyframe steps. */
function ruleSelectors(css: string): string[] {
  const source = stripComments(css)
  const selectors: string[] = []
  let inKeyframes = 0
  let depth = 0
  const pattern = /([^{}]*)([{}])/g
  for (let m = pattern.exec(source); m; m = pattern.exec(source)) {
    const head = m[1].trim()
    if (m[2] === '}') {
      depth--
      if (inKeyframes && depth < inKeyframes) inKeyframes = 0
      continue
    }
    depth++
    if (head.startsWith('@')) {
      if (/^@(-webkit-)?keyframes/.test(head)) inKeyframes = depth
      continue
    }
    if (inKeyframes) continue
    // the text before "{" may still hold the tail of a declaration block
    const header = head.slice(head.lastIndexOf(';') + 1).trim()
    selectors.push(...header.split(',').map((s) => s.trim()).filter(Boolean))
  }
  return selectors
}

const styleFiles = Object.entries(files).filter(([path]) => !path.endsWith('/index.css'))
const idOf = (path: string) => /styles\/(.+)\.css$/.exec(path)![1]

it('has a CSS file for each of the 9 styles', () => {
  expect(styleFiles).toHaveLength(9)
})

/*
 * Each file is one @scope block: it starts at an element carrying this style and
 * stops at any nested element that carries a style of its own. So the app-wide
 * theme on <html> never leaks into a thumbnail drawn in another style (D-017).
 */
it.each(styleFiles)('%s is a single @scope block for its own style', (path, css) => {
  const source = stripComments(css)
  const head = `@scope ([data-design-style="${idOf(path)}"]) to ([data-design-style]) {`
  expect(source.startsWith(head), source.slice(0, 120)).toBe(true)
  expect(source.endsWith('}')).toBe(true)
  // nothing after the block closes
  let depth = 0
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) expect(i, 'content after the @scope block').toBe(source.length - 1)
  }
})

it.each(styleFiles)('%s writes selectors relative to the scope', (_path, css) => {
  const selectors = ruleSelectors(css)
  expect(selectors.length).toBeGreaterThan(0)
  for (const selector of selectors) expect(selector, selector).not.toContain('data-design-style')
})

it('reads selectors correctly (self-check)', () => {
  expect(ruleSelectors('@scope (a) to (b) { :scope x { c: d } y { c: d } }')).toEqual([':scope x', 'y'])
  expect(ruleSelectors('@keyframes k { from { opacity: 0 } to { opacity: 1 } }')).toEqual([])
  expect(ruleSelectors('@media (x) { b { c: d } }')).toEqual(['b'])
})
