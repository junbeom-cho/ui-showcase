import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon, type LucideIcon } from 'lucide-react'

export type Tone = 'info' | 'success' | 'warning' | 'error'

type ToneStyle = {
  label: string
  icon: LucideIcon
  /** round chip behind the icon on a neutral surface (toast) */
  chip: string
  /** small solid accents: time bar, dots */
  accent: string
  /** tinted strip or box: banner, section message */
  tint: string
  /** coloured text for messages under a field */
  text: string
}

export const TONES: Record<Tone, ToneStyle> = {
  info: {
    label: '정보',
    icon: InfoIcon,
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    accent: 'bg-blue-500',
    tint: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100',
    text: 'text-blue-700 dark:text-blue-300',
  },
  success: {
    label: '성공',
    icon: CheckCircle2Icon,
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    accent: 'bg-emerald-500',
    tint: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    label: '주의',
    icon: AlertTriangleIcon,
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    accent: 'bg-amber-500',
    tint: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
    text: 'text-amber-700 dark:text-amber-400',
  },
  error: {
    label: '오류',
    icon: AlertCircleIcon,
    chip: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    accent: 'bg-red-500',
    tint: 'border-red-200 bg-red-50 text-red-950 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100',
    text: 'text-destructive',
  },
}

/** Toasts stay this long unless the pointer or focus is on them. */
export const TOAST_DURATION = 4000
/** How long the snackbar offers its undo. */
export const SNACKBAR_DURATION = 5000
