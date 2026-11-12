import css from './index.css?raw'

/*
 * State galleries (D-019) pin hover, pressed and focus looks on a component by
 * setting data-demo-state. That only works if Tailwind's built-in variants also
 * match the attribute, so index.css must redefine them.
 */
/** The text of `@custom-variant <name> { … }` up to its closing brace at column 0. */
const variantBody = (name: string) => {
  const at = css.indexOf(`@custom-variant ${name} {`)
  expect(at, `@custom-variant ${name}`).toBeGreaterThanOrEqual(0)
  return css.slice(at, css.indexOf('\n}', at) + 2)
}

it.each([
  ['hover', ':hover', 'hover'],
  ['active', ':active', 'active'],
  ['focus', ':focus', 'focus'],
  ['focus-visible', ':focus-visible', 'focus'],
])('the %s variant still matches %s and also data-demo-state~="%s"', (name, pseudo, state) => {
  const body = variantBody(name)
  expect(body).toContain(`&${pseudo}`)
  expect(body).toContain(`&[data-demo-state~="${state}"]`)
})
