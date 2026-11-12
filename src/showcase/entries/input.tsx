import { useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { CheckIcon, EyeIcon, EyeOffIcon, Loader2Icon, SearchIcon, UserIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { StateGrid } from '../state-grid'
import type { ShowcaseEntry } from '../types'

// Fields sit on graph paper, so give them a solid surface. shadcn's Input has
// no hover look of its own; a slightly darker border makes that state visible.
const field = 'bg-background hover:border-foreground/30'
// An icon laid over the start or end of a field (the field gets matching padding).
const iconAt = (side: 'start' | 'end') =>
  cn('pointer-events-none absolute top-1/2 size-4 -translate-y-1/2', side === 'start' ? 'left-2.5' : 'right-2.5')
const buttonAtEnd = 'absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground'

/** One state cell: the field (and anything laid over it), then an optional line of text. */
function Cell({ children, note, tone = 'muted' }: { children: ReactNode; note?: string; tone?: 'muted' | 'error' | 'success' }) {
  return (
    <div className="grid w-full max-w-44 gap-1.5">
      <div className="relative">{children}</div>
      {note && (
        <p
          className={cn(
            'text-xs',
            tone === 'error' ? 'text-destructive' : tone === 'success' ? 'text-emerald-600' : 'text-muted-foreground',
          )}
        >
          {note}
        </p>
      )}
    </div>
  )
}

function States() {
  return (
    <StateGrid
      items={[
        { label: '기본', node: <Cell><Input aria-label="기본" placeholder="이름" className={field} /></Cell> },
        {
          label: '호버',
          node: <Cell><Input aria-label="호버" placeholder="이름" data-demo-state="hover" className={field} /></Cell>,
        },
        {
          label: '포커스',
          node: <Cell><Input aria-label="포커스" placeholder="이름" data-demo-state="focus" className={field} /></Cell>,
        },
        { label: '입력됨', node: <Cell><Input aria-label="입력됨" defaultValue="김하늘" className={field} /></Cell> },
        { label: '비활성', node: <Cell><Input aria-label="비활성" defaultValue="김하늘" disabled className={field} /></Cell> },
        {
          label: '읽기 전용',
          node: (
            <Cell note="고칠 수 없지만 복사는 됩니다">
              <Input aria-label="읽기 전용" defaultValue="A-1029" readOnly className={cn(field, 'bg-muted/60 hover:border-input')} />
            </Cell>
          ),
        },
        {
          label: '오류',
          node: (
            <Cell note="@가 빠졌습니다" tone="error">
              <Input aria-label="오류" defaultValue="haneul.mail.com" aria-invalid className={field} />
            </Cell>
          ),
        },
        {
          label: '확인됨',
          node: (
            <Cell note="쓸 수 있는 아이디입니다" tone="success">
              <Input
                aria-label="확인됨"
                defaultValue="haneul"
                className={cn(field, 'border-emerald-600 pr-8 hover:border-emerald-600')}
              />
              <CheckIcon className={cn(iconAt('end'), 'text-emerald-600')} />
            </Cell>
          ),
        },
        {
          label: '불러오는 중',
          node: (
            <Cell note="아이디를 확인하는 중">
              <Input aria-label="불러오는 중" defaultValue="haneul" aria-busy className={cn(field, 'pr-8')} />
              <Loader2Icon className={cn(iconAt('end'), 'text-muted-foreground motion-safe:animate-spin')} />
            </Cell>
          ),
        },
      ]}
    />
  )
}

function InputPreview() {
  const id = useId()
  return (
    <div className="grid w-full max-w-60 gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-name`}>이름</Label>
        <Input id={`${id}-name`} defaultValue="김하늘" className={field} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-email`}>이메일</Label>
        <Input id={`${id}-email`} type="email" placeholder="name@example.com" className={field} />
      </div>
    </div>
  )
}

const NICKNAME_MAX = 12

function InputSpecimen() {
  const id = useId()
  const [nickname, setNickname] = useState('')
  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor={id}>닉네임</Label>
      <div className="relative">
        <UserIcon data-slot="input-icon" className={cn(iconAt('start'), 'text-muted-foreground')} />
        <Input
          id={id}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NICKNAME_MAX}
          placeholder="2–12자"
          aria-describedby={`${id}-help ${id}-count`}
          className={cn(field, 'pl-8')}
        />
      </div>
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <p id={`${id}-help`} data-slot="input-description">
          다른 사람에게 보이는 이름입니다.
        </p>
        <span id={`${id}-count`} data-slot="input-counter" className="shrink-0 tabular-nums">
          {nickname.length} / {NICKNAME_MAX}
        </span>
      </div>
    </div>
  )
}

function emailError(value: string) {
  const email = value.trim()
  if (!email) return '이메일을 적어 주세요.'
  if (!email.includes('@')) return '@가 빠졌습니다. 예: name@example.com'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '이메일 형식이 아닙니다. 예: name@example.com'
  return undefined
}

function LabelAndHelp() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  // judge the address only once the user has left the field
  const error = touched ? emailError(email) : undefined

  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor={`${id}-email`}>이메일</Label>
      <Input
        id={`${id}-email`}
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-help`}
        className={field}
      />
      {error ? (
        <p key="error" id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p key="help" id={`${id}-help`} className="text-xs text-muted-foreground">
          영수증을 받을 주소입니다.
        </p>
      )}
    </div>
  )
}

const fruits = ['사과', '바나나', '포도', '딸기', '복숭아', '귤', '수박', '자두']

function IconsAndButtons() {
  const id = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(false)
  const q = query.trim()
  const found = fruits.filter((fruit) => fruit.includes(q))

  return (
    <div className="grid w-full max-w-xs gap-6">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-search`}>과일 검색</Label>
        <div className="relative">
          <SearchIcon className={cn(iconAt('start'), 'text-muted-foreground')} />
          <Input
            ref={searchRef}
            id={`${id}-search`}
            type="search"
            placeholder="예: 포도"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // hide the browser's own clear button; ours does the same job everywhere
            className={cn(field, 'px-8 [&::-webkit-search-cancel-button]:appearance-none')}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="검색어 지우기"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              className={buttonAtEnd}
            >
              <XIcon />
            </Button>
          )}
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {!q ? `과일 ${fruits.length}개` : found.length ? `${found.length}개 찾음: ${found.join(', ')}` : '찾는 과일이 없습니다'}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-password`}>비밀번호</Label>
        <div className="relative">
          <Input
            id={`${id}-password`}
            type={shown ? 'text' : 'password'}
            autoComplete="new-password"
            defaultValue="sunny-day-42"
            // Edge draws its own reveal button; keep only ours
            className={cn(field, 'pr-9 [&::-ms-reveal]:hidden')}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="비밀번호 보기"
            aria-pressed={shown}
            onClick={() => setShown(!shown)}
            className={buttonAtEnd}
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {shown ? '적은 글자가 그대로 보입니다.' : '적은 글자가 ●로 가려져 있습니다.'}
        </p>
      </div>
    </div>
  )
}

type Keyboard = { kind: 'pad'; keys: string[] } | { kind: 'letters'; bottom: string[] }

type Format = {
  id: string
  name: string
  attrs: ComponentProps<'input'>
  code: string
  keyboardName: string
  keyboard: Keyboard
  note: string
}

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const formats: Format[] = [
  {
    id: 'email',
    name: '이메일',
    attrs: { type: 'email', autoComplete: 'email', placeholder: 'name@example.com' },
    code: 'type="email"',
    keyboardName: '@와 . 키가 있는 글자 키보드',
    keyboard: { kind: 'letters', bottom: ['123', '@', '스페이스', '.', '↵'] },
    note: '주소에 꼭 들어가는 @와 . 키가 맨 아래 줄에 바로 나옵니다.',
  },
  {
    id: 'tel',
    name: '전화번호',
    attrs: { type: 'tel', autoComplete: 'tel', placeholder: '010-1234-5678' },
    code: 'type="tel"',
    keyboardName: '전화 숫자 패드',
    keyboard: { kind: 'pad', keys: [...digits, '*', '0', '#'] },
    note: '전화를 걸 때처럼 큰 숫자 패드가 나옵니다. * 와 # 키도 있습니다.',
  },
  {
    id: 'number',
    name: '수량',
    attrs: { type: 'number', min: 0, placeholder: '1' },
    code: 'type="number"',
    keyboardName: '숫자와 소수점 패드',
    keyboard: { kind: 'pad', keys: [...digits, '.', '0', '-'] },
    note: '숫자 키보드가 나오고, 컴퓨터에서는 칸 끝에 값을 올리고 내리는 화살표가 붙습니다.',
  },
  {
    id: 'code',
    name: '인증번호',
    attrs: { type: 'text', inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 6, placeholder: '6자리 숫자' },
    code: 'type="text" inputMode="numeric"',
    keyboardName: '숫자만 있는 패드',
    keyboard: { kind: 'pad', keys: [...digits, '', '0', '⌫'] },
    note: '키보드만 숫자로 바꿉니다. type="number"와 달리 0으로 시작하는 번호도 그대로 남고 화살표도 붙지 않습니다.',
  },
  {
    id: 'url',
    name: '웹사이트',
    attrs: { type: 'url', autoComplete: 'url', placeholder: 'https://example.com' },
    code: 'type="url"',
    keyboardName: '/와 .com 키가 있는 글자 키보드',
    keyboard: { kind: 'letters', bottom: ['123', '/', '.', '.com', '↵'] },
    note: '주소에는 띄어쓰기가 없으니 스페이스 자리에 / 와 .com 키가 나옵니다.',
  },
  {
    id: 'search',
    name: '검색',
    attrs: { type: 'search', placeholder: '검색어' },
    code: 'type="search"',
    keyboardName: '검색 키가 있는 글자 키보드',
    keyboard: { kind: 'letters', bottom: ['123', '스페이스', '검색'] },
    note: '줄바꿈 키 자리에 "검색" 키가 나와, 누르면 바로 검색합니다.',
  },
]

const LETTER_ROWS = ['ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ', 'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ', 'ㅋㅌㅊㅍㅠㅜㅡ']
const PLAIN_KEYS = new Set(['123', '스페이스', '↵'])

function Key({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn('grid h-7 min-w-0 place-items-center rounded-[5px] bg-background text-[11px] shadow-xs', className)}>
      {children}
    </span>
  )
}

/** A rough drawing of the phone keyboard a format brings up. */
function PhoneKeyboard({ format }: { format: Format }) {
  const { keyboard } = format
  return (
    <div role="img" aria-label={`휴대폰 키보드 그림: ${format.keyboardName}`} className="w-full max-w-64 rounded-xl bg-muted p-1.5">
      {keyboard.kind === 'pad' ? (
        <div className="grid grid-cols-3 gap-1">
          {keyboard.keys.map((key, i) => (
            <Key key={i} className={cn('h-9 text-sm', !key && 'invisible')}>
              {key}
            </Key>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {LETTER_ROWS.map((row) => (
            <div key={row} className="flex justify-center gap-1">
              {[...row].map((letter) => (
                <Key key={letter} className="w-[calc((100%_-_36px)/10)]">
                  {letter}
                </Key>
              ))}
            </div>
          ))}
          <div className="flex gap-1">
            {keyboard.bottom.map((key) => (
              <Key
                key={key}
                className={cn(
                  key === '스페이스' ? 'flex-[3]' : 'flex-1',
                  !PLAIN_KEYS.has(key) && 'bg-primary font-medium text-primary-foreground',
                )}
              >
                {key}
              </Key>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KeyboardTypes() {
  const id = useId()
  const [formatId, setFormatId] = useState(formats[0].id)
  const format = formats.find((f) => f.id === formatId) ?? formats[0]

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <ToggleGroup
        type="single"
        aria-label="입력 형식"
        variant="outline"
        size="sm"
        value={format.id}
        onValueChange={(value) => value && setFormatId(value)}
        className="flex-wrap justify-center"
      >
        {formats.map((f) => (
          <ToggleGroupItem key={f.id} value={f.id} className="px-3">
            {f.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid w-full gap-2">
        <Label htmlFor={`${id}-field`}>{format.name}</Label>
        {/* a new key per format starts each one empty */}
        <Input key={format.id} id={`${id}-field`} {...format.attrs} aria-describedby={`${id}-note`} className={field} />
        <code className="font-mono text-xs">{format.code}</code>
        <p id={`${id}-note`} className="text-xs text-muted-foreground">
          {format.note}
        </p>
      </div>

      <PhoneKeyboard format={format} />
      <p className="text-center text-xs text-muted-foreground">
        type은 값의 종류(검사·자동 완성 포함)를, inputMode는 키보드 모양만 정합니다. 실제 키보드는 기기마다 조금씩 다릅니다.
      </p>
    </div>
  )
}

const addon = 'flex items-center border border-input bg-muted px-2.5 text-sm text-muted-foreground'
const withCommas = (digitsOnly: string) => digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

function Addons() {
  const id = useId()
  const [price, setPrice] = useState('12000')
  const [site, setSite] = useState('example.com')

  return (
    <div className="grid w-full max-w-xs gap-5">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-price`}>가격</Label>
        <div className="flex">
          <Input
            id={`${id}-price`}
            inputMode="numeric"
            value={withCommas(price)}
            // keep digits only; drop leading zeros and the commas we add for display
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12))}
            aria-describedby={`${id}-won`}
            className={cn(field, 'rounded-r-none text-right tabular-nums')}
          />
          <span id={`${id}-won`} className={cn(addon, 'rounded-r-lg border-l-0')}>
            원
          </span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-site`}>홈페이지</Label>
        <div className="flex">
          <span id={`${id}-scheme`} className={cn(addon, 'rounded-l-lg border-r-0')}>
            https://
          </span>
          <Input
            id={`${id}-site`}
            type="text"
            inputMode="url"
            autoComplete="off"
            value={site}
            // a pasted full address keeps working: the prefix is already there
            onChange={(e) => setSite(e.target.value.replace(/^https?:\/\//, ''))}
            aria-describedby={`${id}-scheme`}
            className={cn(field, 'rounded-l-none')}
          />
        </div>
      </div>

      <p role="status" className="text-sm">
        가격 {withCommas(price) || 0}원 · 주소 https://{site || '…'}
      </p>
    </div>
  )
}

export const inputEntry: ShowcaseEntry = {
  id: 'input',
  name: 'Input',
  aliases: ['Text field', 'Text input', 'Text box', '입력창', '입력 필드', '텍스트 필드'],
  description: '이름이나 이메일처럼 짧은 글을 한 줄로 적어 넣는 칸.',
  category: 'input',
  Preview: InputPreview,
  anatomy: {
    Specimen: InputSpecimen,
    parts: [
      { slot: 'label', name: 'Label', description: '무엇을 적는 칸인지 알려주는 이름. 누르면 칸에 커서가 들어감' },
      { slot: 'input-icon', name: 'icon', description: '칸의 용도를 그림으로 알려주는 앞쪽 아이콘' },
      { slot: 'input', name: 'Input', description: '글자를 적는 칸. 비어 있을 때는 흐린 예시 글(placeholder)이 보임' },
      { slot: 'input-description', name: 'helper text', description: '칸 아래의 도움말. 잘못 적으면 같은 자리에 오류 메시지가 나옴' },
      { slot: 'input-counter', name: 'counter', description: '지금까지 적은 글자 수와 최대 글자 수' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '같은 입력칸이 놓이는 상태를 나란히 놓았습니다. 호버와 포커스는 마우스나 키보드 없이도 보이도록 고정해 그렸습니다.',
      Demo: States,
    },
    {
      title: '라벨과 도움말',
      description: '칸 위에는 이름(라벨), 아래에는 도움말을 둡니다. 이메일을 잘못 적고 칸을 벗어나면 도움말 자리에 오류가 나타납니다.',
      Demo: LabelAndHelp,
    },
    {
      title: '아이콘과 버튼이 붙은 입력',
      description:
        '앞쪽 돋보기는 칸의 용도를, 글을 적으면 나타나는 × 버튼은 한 번에 지우기를 뜻합니다. 비밀번호 칸의 눈 버튼은 가린 글자를 보여 줍니다.',
      Demo: IconsAndButtons,
    },
    {
      title: '입력 형식별 키보드',
      description: '휴대폰은 칸의 type과 inputMode에 따라 다른 키보드를 띄웁니다. 형식을 바꿔 가며 칸과 키보드 그림을 비교해 보세요.',
      Demo: KeyboardTypes,
    },
    {
      title: '앞뒤 붙임 (addon)',
      description: '단위나 주소 앞부분처럼 늘 같은 글은 칸 앞뒤에 붙여 두고, 사용자는 나머지만 적게 합니다.',
      Demo: Addons,
    },
  ],
}
