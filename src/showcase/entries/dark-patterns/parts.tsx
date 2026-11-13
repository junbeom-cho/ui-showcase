import { useId, useState, type ComponentType, type ReactNode } from 'react'
import { ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

/**
 * Outlines one part of a demo and says what it does: red and dashed for the trick,
 * green for the honest alternative.
 */
export function Flag({
  note,
  honest = false,
  children,
  className,
}: {
  note: string
  honest?: boolean
  children: ReactNode
  className?: string
}) {
  const Icon = honest ? ShieldCheckIcon : TriangleAlertIcon
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'rounded-md outline-2 outline-offset-2',
          honest ? 'outline-emerald-500/70' : 'outline-dashed outline-red-500',
        )}
      >
        {children}
      </div>
      <p
        className={cn(
          'flex items-start gap-1 text-[11px] leading-snug',
          honest ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}
      >
        <Icon aria-hidden className="mt-px size-3 shrink-0" />
        <span>
          <strong className="font-semibold">{honest ? '정직' : '속임수'}</strong> {note}
        </span>
      </p>
    </div>
  )
}

/** The result line under every demo, starting with which version is showing. */
export function Status({ honest, children }: { honest: boolean; children: ReactNode }) {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {honest ? '정직한 버전' : '속임수 버전'} · {children}
    </p>
  )
}

/** Shows a demo with a switch that swaps it for the honest version; switching starts it over. */
export function Compare({ Demo }: { Demo: ComponentType<{ honest: boolean }> }) {
  const [honest, setHonest] = useState(false)
  const id = useId()
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch id={id} checked={honest} onCheckedChange={setHonest} />
        <Label htmlFor={id}>정직한 버전 보기</Label>
      </div>
      <Demo key={String(honest)} honest={honest} />
    </div>
  )
}
