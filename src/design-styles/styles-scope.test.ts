const files = import.meta.glob('./styles/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Selectors of every style rule, skipping at-rule headers and keyframe steps. */
function ruleSelectors(css: string): string[] {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
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

it('has a CSS file for each of the 9 styles', () => {
  expect(styleFiles).toHaveLength(9)
})

it.each(styleFiles)('%s stays inside its scope', (path, css) => {
  const id = /styles\/(.+)\.css$/.exec(path)![1]
  const selectors = ruleSelectors(css)
  expect(selectors.length).toBeGreaterThan(0)
  for (const selector of selectors) {
    expect(selector.startsWith(`[data-design-style="${id}"]`), selector).toBe(true)
  }
})

it('rejects a selector outside the scope (self-check)', () => {
  expect(ruleSelectors('[data-design-style="a"] .x { color: red } .leak { color: red }')).toEqual([
    '[data-design-style="a"] .x',
    '.leak',
  ])
  expect(ruleSelectors('@keyframes k { from { opacity: 0 } to { opacity: 1 } }')).toEqual([])
  expect(ruleSelectors('@media (x) { [data-design-style="a"] b { c: d } }')).toEqual(['[data-design-style="a"] b'])
})
