/** One recognisable feature of a style, pointed at a data-slot inside the demo. */
export type DesignStyleTrait = {
  slot: string
  title: string
  description: string
}

export type DesignStyle = {
  /** kebab-case, used in #/style/<id> and data-design-style */
  id: string
  /** Korean, e.g. '뉴모피즘' */
  name: string
  /** e.g. 'Neumorphism' */
  englishName: string
  /** other names, e.g. ['Soft UI'] */
  aliases: string[]
  /** one Korean sentence */
  description: string
  /** one Korean sentence: when it spread and where it was seen */
  context: string
  /** extra notice shown on the page */
  note?: string
  /** 3–4 */
  traits: DesignStyleTrait[]
}
