import { cn } from '@/lib/utils'

// Small drawings made of SVG shapes (no image files); colours come from theme classes so dark mode works.

type ArtProps = { className?: string }

const artClass = 'h-24 w-[7.5rem] shrink-0'

function Shadow({ rx = 38 }: { rx?: number }) {
  return <ellipse cx="60" cy="89" rx={rx} ry="4" className="fill-muted" />
}

/** An empty folder with a plus: nothing here yet. */
export function FolderArt({ className }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow />
      <path
        d="M20 26a5 5 0 0 1 5-5h20l7 7h43a5 5 0 0 1 5 5v44a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5z"
        strokeWidth="2"
        className="fill-blue-100 stroke-blue-500 dark:fill-blue-500/20"
      />
      <rect x="30" y="30" width="60" height="30" rx="3" strokeWidth="1.5" className="fill-background stroke-blue-300 dark:stroke-blue-400/50" />
      <path d="M38 39h30M38 46h22" strokeWidth="2" strokeLinecap="round" className="stroke-blue-200 dark:stroke-blue-400/40" />
      <path
        d="M18 46a5 5 0 0 1 5-5h74a5 5 0 0 1 5 5l-3 31a5 5 0 0 1-5 4.5H26a5 5 0 0 1-5-4.5z"
        strokeWidth="2"
        className="fill-blue-200 stroke-blue-500 dark:fill-blue-500/30"
      />
      <circle cx="60" cy="62" r="10" strokeWidth="2" className="fill-background stroke-blue-500" />
      <path d="M60 57v10M55 62h10" strokeWidth="2.5" strokeLinecap="round" className="stroke-blue-500" />
      <path d="M104 12v8M100 16h8M14 14v6M11 17h6" strokeWidth="2" strokeLinecap="round" className="stroke-amber-400" />
    </svg>
  )
}

/** A list sheet with a magnifier that found nothing. */
export function SearchArt({ className }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow />
      <rect x="20" y="12" width="56" height="70" rx="6" strokeWidth="2" className="fill-background stroke-muted-foreground/40" />
      <path
        d="M30 28h36M30 40h28M30 52h32M30 64h20"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 6"
        className="stroke-muted-foreground/25"
      />
      <circle cx="78" cy="54" r="16" strokeWidth="3" className="fill-background stroke-violet-500" />
      <path d="M90 66l12 12" strokeWidth="5" strokeLinecap="round" className="stroke-violet-500" />
      <path d="M72 48l12 12M84 48 72 60" strokeWidth="2.5" strokeLinecap="round" className="stroke-violet-500" />
    </svg>
  )
}

/** A big tick; with `celebrate`, confetti pops around it (only when motion is welcome). */
export function DoneArt({ className, celebrate = false }: ArtProps & { celebrate?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow rx={30} />
      <g
        className={cn(
          'origin-center [transform-box:fill-box]',
          celebrate && 'motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-500',
        )}
      >
        <circle cx="60" cy="46" r="28" strokeWidth="2.5" className="fill-emerald-100 stroke-emerald-500 dark:fill-emerald-500/20" />
        <path d="M47 47l9 9 18-19" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-emerald-600 dark:stroke-emerald-400" />
      </g>
      <g
        className={cn(
          'origin-center [transform-box:fill-box]',
          celebrate && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-50 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-backwards',
        )}
      >
        <rect x="14" y="20" width="7" height="3" rx="1" transform="rotate(-30 17 21)" className="fill-amber-400" />
        <rect x="98" y="14" width="7" height="3" rx="1" transform="rotate(25 101 15)" className="fill-pink-400" />
        <circle cx="22" cy="60" r="2.5" className="fill-sky-400" />
        <circle cx="102" cy="56" r="2.5" className="fill-amber-400" />
        <rect x="90" y="76" width="6" height="3" rx="1" transform="rotate(40 93 77)" className="fill-violet-400" />
        <rect x="24" y="78" width="6" height="3" rx="1" transform="rotate(-20 27 79)" className="fill-emerald-400" />
        <path d="M60 4v6M57 7h6M108 36v5M105.5 38.5h5" strokeWidth="2" strokeLinecap="round" className="stroke-amber-400" />
      </g>
    </svg>
  )
}

/** A signpost whose sign reads 404, pointing nowhere. */
export function NotFoundArt({ className }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow />
      <rect x="57" y="18" width="6" height="70" rx="2" className="fill-muted-foreground/45" />
      <path d="M26 22h48l9 9-9 9H26z" strokeWidth="2" strokeLinejoin="round" className="fill-amber-100 stroke-amber-500 dark:fill-amber-500/20" />
      <text x="50" y="35.5" textAnchor="middle" className="fill-amber-700 text-[12px] font-bold dark:fill-amber-300">
        404
      </text>
      <path d="M94 48H46l-9 9 9 9h48z" strokeWidth="2" strokeLinejoin="round" className="fill-background stroke-muted-foreground/50" />
      <text x="70" y="61.5" textAnchor="middle" className="fill-muted-foreground text-[12px] font-bold">
        ?
      </text>
    </svg>
  )
}

/** A closed padlock. */
export function LockArt({ className }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow rx={32} />
      <path d="M44 42V32a16 16 0 0 1 32 0v10" strokeWidth="6" strokeLinecap="round" className="stroke-muted-foreground/55" />
      <rect x="34" y="40" width="52" height="42" rx="8" strokeWidth="2.5" className="fill-rose-100 stroke-rose-500 dark:fill-rose-500/20" />
      <circle cx="60" cy="57" r="5" className="fill-rose-500" />
      <path d="M60 60v10" strokeWidth="4" strokeLinecap="round" className="stroke-rose-500" />
    </svg>
  )
}

/** A cloud with a line through it: no connection. */
export function OfflineArt({ className }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow rx={34} />
      <path
        d="M38 74h46a15 15 0 0 0 1.5-29.9A21 21 0 0 0 45 40a17 17 0 0 0-7 34z"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="fill-sky-100 stroke-sky-500 dark:fill-sky-500/20"
      />
      <path d="M30 18l62 64" strokeWidth="9" strokeLinecap="round" className="stroke-background" />
      <path d="M30 18l62 64" strokeWidth="3.5" strokeLinecap="round" className="stroke-muted-foreground" />
    </svg>
  )
}

/** Two server boxes, one with a red light, and a warning sign. */
export function ServerArt({ className }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 96" fill="none" className={cn(artClass, className)}>
      <Shadow />
      <rect x="26" y="16" width="60" height="26" rx="5" strokeWidth="2" className="fill-background stroke-muted-foreground/50" />
      <rect x="26" y="48" width="60" height="26" rx="5" strokeWidth="2" className="fill-background stroke-muted-foreground/50" />
      <circle cx="37" cy="29" r="3" className="fill-emerald-500" />
      <circle cx="37" cy="61" r="3" className="fill-red-500" />
      <path d="M48 29h28M48 61h28" strokeWidth="3" strokeLinecap="round" className="stroke-muted-foreground/30" />
      <path d="M56 74v12" strokeWidth="2" className="stroke-muted-foreground/50" />
      <path d="M96 52l14 25H82z" strokeWidth="2" strokeLinejoin="round" className="fill-amber-100 stroke-amber-500 dark:fill-amber-500/20" />
      <path d="M96 61v8" strokeWidth="2.5" strokeLinecap="round" className="stroke-amber-600 dark:stroke-amber-400" />
      <circle cx="96" cy="73" r="1.5" className="fill-amber-600 dark:fill-amber-400" />
    </svg>
  )
}
