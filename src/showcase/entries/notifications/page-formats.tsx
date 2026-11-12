import { useId, useRef, useState, type FormEvent } from 'react'
import { AlertCircleIcon, CheckCircle2Icon, RotateCwIcon, WifiOffIcon, WrenchIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PageSketch } from './parts'
import { TONES } from './tones'

/** 3. Strips across the top of a page that stay until closed or until the situation changes. */
export function BannerFormat() {
  const [online, setOnline] = useState(true)
  // kept above the page, so it survives the page being "reloaded" (remounted)
  const [dismissed, setDismissed] = useState(false)
  const [reloads, setReloads] = useState(0)
  const switchId = useId()

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Switch id={switchId} checked={online} onCheckedChange={setOnline} />
          <Label htmlFor={switchId}>인터넷 연결</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReloads((n) => n + 1)}>
          <RotateCwIcon data-icon="inline-start" />
          페이지 새로고침
        </Button>
        <Button variant="ghost" size="sm" disabled={!dismissed} onClick={() => setDismissed(false)}>
          닫은 배너 다시 보기
        </Button>
      </div>

      <div
        key={reloads}
        className="h-72 overflow-hidden rounded-lg border bg-background motion-safe:animate-in motion-safe:fade-in-0"
      >
        {!online && (
          <div
            role="alert"
            className="flex items-center gap-2.5 bg-foreground px-4 py-2 text-sm text-background"
          >
            <WifiOffIcon aria-hidden className="size-4 shrink-0" />
            <p className="flex-1">인터넷에 연결되어 있지 않습니다. 연결되면 저절로 다시 시도합니다.</p>
          </div>
        )}
        {!dismissed && (
          <div
            role="region"
            aria-label="점검 안내"
            className={cn('flex items-center gap-2.5 border-b py-2 pr-2 pl-4 text-sm', TONES.info.tint)}
          >
            <WrenchIcon aria-hidden className="size-4 shrink-0" />
            <p className="flex-1">
              11월 20일(금) 새벽 2시~4시에 점검합니다. 이 시간에는 결제가 되지 않습니다.{' '}
              <a href="#" className="font-medium underline underline-offset-3">
                자세히
              </a>
            </p>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="점검 안내 닫기"
              className="hover:bg-blue-100 dark:hover:bg-blue-500/20"
              onClick={() => setDismissed(true)}
            >
              <XIcon />
            </Button>
          </div>
        )}
        <div aria-hidden className="flex items-center gap-3 border-b px-4 py-2.5">
          <span className="size-5 rounded-md bg-foreground/80" />
          <span className="h-2.5 w-12 rounded bg-muted" />
          <span className="h-2.5 w-12 rounded bg-muted" />
          <span className="ml-auto size-6 rounded-full bg-muted" />
        </div>
        <PageSketch />
      </div>

      <p role="status" className="text-sm text-muted-foreground">
        점검 배너: {dismissed ? '닫음 (새로고침해도 다시 뜨지 않습니다)' : '보임'} · {online ? '온라인' : '오프라인'} ·
        새로고침 {reloads}번
      </p>
    </div>
  )
}

type Field = 'nickname' | 'email'

const TAKEN = ['admin', '관리자']

function nicknameError(value: string) {
  const v = value.trim()
  if (!v) return '닉네임을 입력하세요.'
  if (/\s/.test(v)) return '띄어쓰기는 쓸 수 없습니다.'
  if (v.length < 2 || v.length > 12) return '2자 이상 12자 이하로 입력하세요.'
  if (TAKEN.includes(v.toLowerCase())) return '이미 쓰고 있는 닉네임입니다.'
  return null
}

function emailError(value: string) {
  const v = value.trim()
  if (!v) return '이메일을 입력하세요.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '이메일 형식이 아닙니다. 예: sky@example.com'
  return null
}

const RULES: Record<Field, (value: string) => string | null> = { nickname: nicknameError, email: emailError }

type SectionMessage = { tone: 'success' | 'error'; text: string } | null

/** 4. Messages placed right where the problem is: under a field, or on top of the section. */
export function InlineMessageFormat() {
  const [values, setValues] = useState<Record<Field, string>>({ nickname: '하늘 고래', email: 'sky@example' })
  const [touched, setTouched] = useState<Record<Field, boolean>>({ nickname: false, email: false })
  const [section, setSection] = useState<SectionMessage>(null)
  const inputs = useRef<Record<Field, HTMLInputElement | null>>({ nickname: null, email: null })
  const id = useId()

  const errors = { nickname: nicknameError(values.nickname), email: emailError(values.email) }
  const shown = (field: Field) => (touched[field] ? errors[field] : null)
  const SectionIcon = section ? TONES[section.tone].icon : null

  const change = (field: Field, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // an old verdict about the whole form no longer holds once it changes
    setSection(null)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched({ nickname: true, email: true })
    const wrong = (Object.keys(RULES) as Field[]).filter((field) => RULES[field](values[field]))
    if (wrong.length > 0) {
      setSection({ tone: 'error', text: `고칠 곳이 ${wrong.length}개 있습니다. 빨간 글씨를 확인하세요.` })
      inputs.current[wrong[0]]?.focus()
    } else {
      setSection({ tone: 'success', text: '프로필을 저장했습니다. 다른 사람에게는 1분 안에 반영됩니다.' })
    }
  }

  const fields: { field: Field; label: string; hint: string; ok?: string }[] = [
    { field: 'nickname', label: '닉네임', hint: '2~12자, 띄어쓰기 없이', ok: '쓸 수 있는 닉네임입니다.' },
    { field: 'email', label: '이메일', hint: '로그인과 알림에 쓰는 주소입니다.' },
  ]

  return (
    <form noValidate onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-background p-5">
      <div>
        <p className="text-base font-semibold">프로필</p>
        {/* section-level message: on top of the fields it is about; always present so it is announced */}
        <div role="status">
          {section && SectionIcon && (
            <div
              className={cn('mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm', TONES[section.tone].tint)}
            >
              <SectionIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>{section.text}</p>
            </div>
          )}
        </div>
      </div>

      {fields.map(({ field, label, hint, ok }) => {
        const error = shown(field)
        const valid = touched[field] && !errors[field]
        const messageId = `${id}-${field}-message`
        return (
          <div key={field} className="flex flex-col gap-1.5">
            <Label htmlFor={`${id}-${field}`}>{label}</Label>
            <Input
              ref={(el) => {
                inputs.current[field] = el
              }}
              id={`${id}-${field}`}
              value={values[field]}
              aria-invalid={error ? true : undefined}
              aria-describedby={messageId}
              onChange={(e) => change(field, e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
            />
            {/* field-level message: right under the field it is about */}
            <p
              id={messageId}
              className={cn(
                'flex items-center gap-1.5 text-xs',
                error ? 'text-destructive' : valid && ok ? TONES.success.text : 'text-muted-foreground',
              )}
            >
              {error ? (
                <>
                  <AlertCircleIcon aria-hidden className="size-3.5 shrink-0" />
                  {error}
                </>
              ) : valid && ok ? (
                <>
                  <CheckCircle2Icon aria-hidden className="size-3.5 shrink-0" />
                  {ok}
                </>
              ) : (
                hint
              )}
            </p>
          </div>
        )
      })}

      <Button type="submit" className="self-end">
        저장
      </Button>
    </form>
  )
}
