import { accordionEntry } from './entries/accordion'
import { alertEntry } from './entries/alert'
import { avatarEntry } from './entries/avatar'
import { badgeEntry } from './entries/badge'
import { breadcrumbEntry } from './entries/breadcrumb'
import { buttonEntry } from './entries/button'
import { cardEntry } from './entries/card'
import { chartsEntry } from './entries/charts'
import { checkboxEntry } from './entries/checkbox'
import { comboboxEntry } from './entries/combobox'
import { contextMenuEntry } from './entries/context-menu'
import { datePickerEntry } from './entries/date-picker'
import { dialogEntry } from './entries/dialog'
import { drawerEntry } from './entries/drawer'
import { dropdownMenuEntry } from './entries/dropdown-menu'
import { emptyStatesEntry } from './entries/empty-states'
import { fileUploadEntry } from './entries/file-upload'
import { gridEntry } from './entries/grid'
import { hoverCardEntry } from './entries/hover-card'
import { inputEntry } from './entries/input'
import { listViewsEntry } from './entries/list-views'
import { loadingStatesEntry } from './entries/loading-states'
import { navigationPatternsEntry } from './entries/navigation-patterns'
import { notificationsEntry } from './entries/notifications'
import { paginationEntry } from './entries/pagination'
import { popoverEntry } from './entries/popover'
import { progressEntry } from './entries/progress'
import { radioGroupEntry } from './entries/radio-group'
import { ratingEntry } from './entries/rating'
import { searchPatternsEntry } from './entries/search-patterns'
import { selectEntry } from './entries/select'
import { separatorEntry } from './entries/separator'
import { sheetEntry } from './entries/sheet'
import { sidebarEntry } from './entries/sidebar'
import { skeletonEntry } from './entries/skeleton'
import { sliderEntry } from './entries/slider'
import { stepperEntry } from './entries/stepper'
import { switchEntry } from './entries/switch'
import { tabsEntry } from './entries/tabs'
import { tagInputEntry } from './entries/tag-input'
import { textareaEntry } from './entries/textarea'
import { toggleGroupEntry } from './entries/toggle-group'
import { tooltipEntry } from './entries/tooltip'
import { aiPatternsEntry } from './entries/ai-patterns'
import { darkPatternsEntry } from './entries/dark-patterns'
import { gesturesEntry } from './entries/gestures'
import { menuIconsEntry } from './entries/menu-icons'
import { mobileNavigationEntry } from './entries/mobile-navigation'
import { quantityStepperEntry } from './entries/quantity-stepper'
import type { ShowcaseEntry } from './types'

export const entries: ShowcaseEntry[] = [
  aiPatternsEntry,
  darkPatternsEntry,
  gesturesEntry,
  menuIconsEntry,
  mobileNavigationEntry,
  quantityStepperEntry,
  accordionEntry,
  alertEntry,
  avatarEntry,
  badgeEntry,
  breadcrumbEntry,
  buttonEntry,
  cardEntry,
  chartsEntry,
  checkboxEntry,
  comboboxEntry,
  contextMenuEntry,
  datePickerEntry,
  dialogEntry,
  drawerEntry,
  dropdownMenuEntry,
  emptyStatesEntry,
  fileUploadEntry,
  gridEntry,
  hoverCardEntry,
  inputEntry,
  listViewsEntry,
  loadingStatesEntry,
  navigationPatternsEntry,
  notificationsEntry,
  paginationEntry,
  popoverEntry,
  progressEntry,
  radioGroupEntry,
  ratingEntry,
  searchPatternsEntry,
  selectEntry,
  separatorEntry,
  sheetEntry,
  sidebarEntry,
  skeletonEntry,
  sliderEntry,
  stepperEntry,
  switchEntry,
  tabsEntry,
  tagInputEntry,
  textareaEntry,
  toggleGroupEntry,
  tooltipEntry,
].sort((a, b) => a.name.localeCompare(b.name, 'en'))
