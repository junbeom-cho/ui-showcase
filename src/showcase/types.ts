import type { ComponentType } from 'react'

export type CategoryId = 'layout' | 'navigation' | 'input' | 'display' | 'feedback' | 'overlay'

export type Category = {
  id: CategoryId
  label: string
  description: string
}

/** One labelled part of a component, found in the specimen by its data-slot attribute. */
export type AnatomyPart = {
  slot: string
  name: string
  description: string
}

export type Example = {
  title: string
  description: string
  Demo: ComponentType
}

export type ShowcaseEntry = {
  /** kebab-case, also used in the URL (#/<id>) */
  id: string
  /** English name as shadcn/ui writes it */
  name: string
  /** other names for the same UI (other libraries, Korean) */
  aliases: string[]
  /** one Korean sentence */
  description: string
  category: CategoryId
  /** small thumbnail used on the overview page */
  Preview: ComponentType
  anatomy: {
    Specimen: ComponentType
    parts: AnatomyPart[]
  }
  examples: Example[]
}
