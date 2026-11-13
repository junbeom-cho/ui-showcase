import { Loader2Icon, SearchIcon, StarIcon, TruckIcon, XIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { splitMatches, won, type Product } from './products'

/** Text with the words of `query` wrapped in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitMatches(text, query).map((piece, i) =>
        piece.match ? (
          <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-400/30">
            {piece.text}
          </mark>
        ) : (
          piece.text
        ),
      )}
    </>
  )
}

/** Text with the typed part in bold, the way suggestion lists show it. */
export function BoldMatch({ text, query, slots = false }: { text: string; query: string; slots?: boolean }) {
  return (
    <>
      {splitMatches(text, query).map((piece, i) =>
        piece.match ? (
          <strong key={i} data-slot={slots && i <= 1 ? 'suggestion-match' : undefined} className="font-semibold text-foreground">
            {piece.text}
          </strong>
        ) : (
          <span key={i} className="text-muted-foreground">
            {piece.text}
          </span>
        ),
      )}
    </>
  )
}

export type FieldLook = 'empty' | 'typing' | 'searching' | 'results' | 'none' | 'error'

/** A drawn search field (state gallery): read-only and out of the tab order. */
export function SearchFieldDrawing({ label, look, value = '' }: { label: string; look: FieldLook; value?: string }) {
  return (
    <div className="flex w-full max-w-60 flex-col gap-1.5 text-left">
      <InputGroup className="bg-background">
        <InputGroupInput aria-label={label} placeholder="상품 검색" value={value} readOnly tabIndex={-1} aria-invalid={look === 'error' || undefined} />
        <InputGroupAddon>
          <SearchIcon aria-hidden />
        </InputGroupAddon>
        {look !== 'empty' && look !== 'error' && (
          <InputGroupAddon align="inline-end">
            {look === 'typing' && (
              <InputGroupButton size="icon-xs" aria-label="검색어 지우기" tabIndex={-1}>
                <XIcon />
              </InputGroupButton>
            )}
            {look === 'searching' && <Loader2Icon aria-label="찾는 중" className="motion-safe:animate-spin" />}
            {look === 'results' && <span className="text-xs font-normal tabular-nums">3개</span>}
            {look === 'none' && <span className="text-xs font-normal">0개</span>}
          </InputGroupAddon>
        )}
      </InputGroup>
      {look === 'none' && <p className="px-1 text-xs text-muted-foreground">맞는 상품이 없어요. 다른 말로 찾아보세요.</p>}
      {look === 'error' && <p className="px-1 text-xs text-destructive">검색하지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>}
    </div>
  )
}

/** One product as a compact result row; words of `query` are highlighted. */
export function ProductRow({ product, query = '', className }: { product: Product; query?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 py-2', className)}>
      <div aria-hidden className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-[10px] text-muted-foreground">
        {product.category.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          <Highlight text={product.name} query={query} />
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{won(product.price)}</span>
          <span className="inline-flex items-center gap-0.5">
            <StarIcon aria-hidden className="size-3 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </span>
          {product.freeShipping && (
            <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400">
              <TruckIcon aria-hidden className="size-3" />
              무료 배송
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

/** 을 or 를 after a Korean word, by whether its last syllable ends in a consonant. */
export function objectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return '을(를)'
  return code % 28 === 0 ? '를' : '을'
}

/** Shortcut hint for the platform: ⌘K on Apple devices, Ctrl K elsewhere. */
export function shortcutLabel() {
  const platform = typeof navigator === 'undefined' ? '' : `${navigator.platform} ${navigator.userAgent}`
  return /Mac|iPhone|iPad/.test(platform) ? '⌘K' : 'Ctrl K'
}
