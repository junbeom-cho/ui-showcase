import { accordionEntry } from './entries/accordion'
import { alertEntry } from './entries/alert'
import { avatarEntry } from './entries/avatar'
import { badgeEntry } from './entries/badge'
import { breadcrumbEntry } from './entries/breadcrumb'
import { buttonEntry } from './entries/button'
import { cardEntry } from './entries/card'
import { checkboxEntry } from './entries/checkbox'
import { dialogEntry } from './entries/dialog'
import { dropdownMenuEntry } from './entries/dropdown-menu'
import { gridEntry } from './entries/grid'
import { paginationEntry } from './entries/pagination'
import { progressEntry } from './entries/progress'
import { separatorEntry } from './entries/separator'
import { sheetEntry } from './entries/sheet'
import { sidebarEntry } from './entries/sidebar'
import { skeletonEntry } from './entries/skeleton'
import { switchEntry } from './entries/switch'
import { tabsEntry } from './entries/tabs'
import { tooltipEntry } from './entries/tooltip'
import type { ShowcaseEntry } from './types'

export const entries: ShowcaseEntry[] = [
  accordionEntry,
  alertEntry,
  avatarEntry,
  badgeEntry,
  breadcrumbEntry,
  buttonEntry,
  cardEntry,
  checkboxEntry,
  dialogEntry,
  dropdownMenuEntry,
  gridEntry,
  paginationEntry,
  progressEntry,
  separatorEntry,
  sheetEntry,
  sidebarEntry,
  skeletonEntry,
  switchEntry,
  tabsEntry,
  tooltipEntry,
].sort((a, b) => a.name.localeCompare(b.name, 'en'))
