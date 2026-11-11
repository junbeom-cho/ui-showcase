import type { ComponentType } from 'react'

export type ShowcaseEntry = {
  /** kebab-case, also used as the card's DOM id */
  id: string
  /** English name as shadcn/ui writes it */
  name: string
  /** other names for the same UI (other libraries, Korean) */
  aliases: string[]
  /** one Korean sentence */
  description: string
  Preview: ComponentType
}
