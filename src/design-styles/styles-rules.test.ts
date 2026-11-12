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

describe('material ripple', () => {
  const css = files['./styles/material.css']
  it.each(['default', 'outline'])('%s button shows its own colour at rest (no wash over it)', (variant) => {
    const rest = declarations(
      css,
      `[data-design-style="material"] [data-slot="button"][data-variant="${variant}"]`,
    )
    const colour = rest['background-color']
    // outside the (huge, transparent) dot the gradient paints the button colour itself
    expect(rest['background-image']).toBe(`radial-gradient(circle, transparent 1%, ${colour} 1%)`)
  })
})
