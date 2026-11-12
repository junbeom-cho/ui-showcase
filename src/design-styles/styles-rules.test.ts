const files = import.meta.glob('./styles/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Declarations of the rule whose selector list is exactly `selector`. */
function declarations(css: string, selector: string): Record<string, string> {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const at = source.indexOf(`${selector} {`)
  if (at < 0) throw new Error(`no rule for ${selector}`)
  const body = source.slice(source.indexOf('{', at) + 1, source.indexOf('}', at))
  return Object.fromEntries(
    body
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]),
  )
}

const THEME_TOKENS = [
  // app frame (D-011 drafting-sheet tokens)
  '--paper', '--ink', '--ink-muted', '--rule', '--gridline', '--blueprint', '--blueprint-soft',
  // shadcn tokens used by every component
  '--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground',
  '--primary', '--primary-foreground', '--secondary', '--secondary-foreground', '--muted',
  '--muted-foreground', '--accent', '--accent-foreground', '--border', '--input', '--ring',
]

const styleFiles = Object.entries(files).filter(([path]) => !path.endsWith('/index.css'))

describe('app-wide theme (D-017)', () => {
  it.each(styleFiles)('%s sets every colour token on its scope root', (_path, css) => {
    // on <html> this themes the whole app; on a nested demo it resets the tokens,
    // so an outer theme's colours never leak into a thumbnail of another style
    const tokens = declarations(css, ':scope')
    for (const token of THEME_TOKENS) expect(tokens[token], token).toBeTruthy()
  })

  it.each(styleFiles)('%s paints the page background when it is the app theme', (_path, css) => {
    expect(declarations(css, ':scope:root body').background).toBeTruthy()
  })

  it.each(styleFiles)('%s dresses the app surfaces like its cards', (_path, css) => {
    expect(css).toMatch(/\[data-slot="demo-sidebar"\],\s*\[data-slot="app-surface"\] \{/)
  })
})

describe('icons per style (D-018)', () => {
  it.each(styleFiles)('%s dresses every icon box', (_path, css) => {
    const box = declarations(css, '[data-style-icon]')
    expect(box.width, 'icon box width').toBeTruthy()
    expect(box.height, 'icon box height').toBeTruthy()
  })

  it.each(styleFiles)('%s no longer styles only the dashboard icons', (_path, css) => {
    expect(css).not.toContain('[data-slot^="demo-icon"]')
  })
})

describe('every button variant is drawn (D-018 component collection)', () => {
  it.each(styleFiles.flatMap(([path, css]) => ['secondary', 'ghost', 'destructive'].map((v) => [path, v, css] as const)))(
    '%s styles the %s button',
    (_path, variant, css) => {
      const rule = declarations(css, `[data-slot="button"][data-variant="${variant}"]`)
      expect(rule.color, 'text colour').toBeTruthy()
    },
  )
})

describe('material ripple', () => {
  const css = files['./styles/material.css']
  it.each(['default', 'outline'])('%s button shows its own colour at rest (no wash over it)', (variant) => {
    const rest = declarations(css, `[data-slot="button"][data-variant="${variant}"]`)
    const colour = rest['background-color']
    // outside the (huge, transparent) dot the gradient paints the button colour itself
    expect(rest['background-image']).toBe(`radial-gradient(circle, transparent 1%, ${colour} 1%)`)
  })
})
