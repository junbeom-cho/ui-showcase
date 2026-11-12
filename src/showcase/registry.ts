import { accordionEntry } from './entries/accordion'
import { alertEntry } from './entries/alert'
import { avatarEntry } from './entries/avatar'
import { badgeEntry } from './entries/badge'
import { breadcrumbEntry } from './entries/breadcrumb'
import { buttonEntry } from './entries/button'
import { cardEntry } from './entries/card'
import { checkboxEntry } from './entries/checkbox'
import { datePickerEntry } from './entries/date-picker'
import { dialogEntry } from './entries/dialog'
import { dropdownMenuEntry } from './entries/dropdown-menu'
import { gridEntry } from './entries/grid'
import { inputEntry } from './entries/input'
import { listViewsEntry } from './entries/list-views'
import { loadingStatesEntry } from './entries/loading-states'
import { notificationsEntry } from './entries/notifications'
import { paginationEntry } from './entries/pagination'
import { progressEntry } from './entries/progress'
import { radioGroupEntry } from './entries/radio-group'
import { selectEntry } from './entries/select'
import { separatorEntry } from './entries/separator'
import { sheetEntry } from './entries/sheet'
import { sidebarEntry } from './entries/sidebar'
import { skeletonEntry } from './entries/skeleton'
import { sliderEntry } from './entries/slider'
import { switchEntry } from './entries/switch'
import { tabsEntry } from './entries/tabs'
import { textareaEntry } from './entries/textarea'
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
  datePickerEntry,
  dialogEntry,
  dropdownMenuEntry,
  gridEntry,
  inputEntry,
  listViewsEntry,
  loadingStatesEntry,
  notificationsEntry,
  paginationEntry,
  progressEntry,
  radioGroupEntry,
  selectEntry,
  separatorEntry,
  sheetEntry,
  sidebarEntry,
  skeletonEntry,
  sliderEntry,
  switchEntry,
  tabsEntry,
  textareaEntry,
  tooltipEntry,
].sort((a, b) => a.name.localeCompare(b.name, 'en'))
