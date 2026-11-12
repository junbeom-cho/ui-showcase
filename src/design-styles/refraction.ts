type UserAgentData = { brands?: { brand: string }[] }

/**
 * Liquid glass bends the backdrop with an SVG filter inside backdrop-filter,
 * which only Chromium renders. Other browsers get the plain-glass fallback.
 */
export function supportsRefraction(nav: Navigator = navigator): boolean {
  const data = (nav as Navigator & { userAgentData?: UserAgentData }).userAgentData
  return data?.brands?.some((b) => b.brand === 'Chromium') ?? false
}
