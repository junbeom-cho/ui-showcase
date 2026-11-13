import { useId, useState, type FormEvent } from 'react'
import { BellIcon, CheckCircle2Icon, PhoneIcon, ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BrowserFrame, ContentSketch, PhoneFrame } from '../navigation-patterns/frames'
import { Compare, Flag, Status, won } from './parts'

type Version = { honest: boolean }

const done = 'flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'

type Plan = 'none' | 'joined' | 'cancelled'

/** 1. Roach motel: one click to join, the way out buried in fine print and a phone line. */
function RoachMotel({ honest }: Version) {
  const [plan, setPlan] = useState<Plan>('none')
  const [joinClicks, setJoinClicks] = useState(0)
  const [cancelClicks, setCancelClicks] = useState(0)
  const [step, setStep] = useState<'idle' | 'asking' | 'calling'>('idle')

  const join = () => {
    setJoinClicks((c) => c + 1)
    setPlan('joined')
    setStep('idle')
  }
  const tryCancel = (next: 'asking' | 'calling') => {
    setCancelClicks((c) => c + 1)
    setStep(next)
  }
  const cancel = () => {
    setCancelClicks((c) => c + 1)
    setPlan('cancelled')
    setStep('idle')
  }

  return (
    <>
      <BrowserFrame url="trip.example/membership" className="min-h-[22rem]">
        <div className="flex flex-col gap-3 p-5">
          <div>
            <p className="text-lg font-semibold">모아 트래블 플러스</p>
            <p className="text-sm text-muted-foreground">월 4,900원 · 오사카 항공권 5% 할인, 무료 좌석 지정</p>
          </div>
          {plan !== 'joined' ? (
            <>
              {plan === 'cancelled' && <p className={done}>해지했어요. 다음 달부터 청구되지 않아요.</p>}
              <Button size="lg" className="self-start" onClick={join}>
                {plan === 'cancelled' ? '다시 가입하기' : '한 번에 가입하기'}
              </Button>
            </>
          ) : (
            <>
              <p className={done}>
                <CheckCircle2Icon aria-hidden className="size-4" />
                가입했어요! 다음 예약부터 5% 할인돼요.
              </p>
              <ContentSketch rows={3} />
              {honest ? (
                <Flag honest note="가입 버튼만큼 잘 보이는 곳에, 같은 화면에서 해지할 수 있어요.">
                  <Button variant="outline" onClick={() => tryCancel('asking')}>
                    멤버십 해지
                  </Button>
                </Flag>
              ) : (
                <Flag note="가입은 큰 버튼 한 번인데, 해지는 흐린 작은 글씨 속 링크와 전화로만 할 수 있어요.">
                  <p className="text-[10px] text-muted-foreground/70">
                    멤버십 관련 문의 및{' '}
                    <button type="button" className="underline" onClick={() => tryCancel('asking')}>
                      해지 안내
                    </button>
                    는 고객센터를 이용해 주세요.
                  </p>
                </Flag>
              )}
              {step !== 'idle' &&
                (honest ? (
                  <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
                    <p>해지할까요? 이미 낸 이번 달(11월 30일까지)은 그대로 쓸 수 있어요.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={cancel}>
                        해지하기
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStep('idle')}>
                        그대로 두기
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 rounded-md border p-3 text-sm">
                    <p>온라인으로는 해지할 수 없어요. 고객센터(1588-0000, 평일 10–17시)로 전화해 주세요.</p>
                    <Button size="sm" variant="outline" className="self-start" onClick={() => tryCancel('calling')}>
                      <PhoneIcon data-icon="inline-start" />
                      전화 걸기 (시연)
                    </Button>
                    {step === 'calling' && (
                      <p className="text-muted-foreground">상담원 연결 대기 중… 앞에 27명, 예상 대기 40분</p>
                    )}
                  </div>
                ))}
            </>
          )}
        </div>
      </BrowserFrame>
      <Status honest={honest}>
        멤버십: {{ none: '가입 안 함', joined: '가입됨', cancelled: '해지됨' }[plan]} · 가입 클릭 {joinClicks}번 · 해지 클릭{' '}
        {cancelClicks}번
      </Status>
    </>
  )
}

const CONSENTS = [
  { id: 'terms', label: '이용약관과 개인정보 처리에 동의 (필수)', short: '이용약관', required: true },
  { id: 'marketing', label: '특가 소식 문자·메일 받기 (선택)', short: '마케팅 수신', required: false },
  { id: 'partners', label: '제휴 보험사·렌터카에 연락처 제공 (선택)', short: '제휴사 제공', required: false },
  { id: 'night', label: '밤 9시 이후 광고 알림 받기 (선택)', short: '야간 광고', required: false },
]

/** 2. Pre-checked consent: the optional boxes start ticked, so skimming means agreeing. */
function PreChecked({ honest }: Version) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONSENTS.map((c) => [c.id, !honest && !c.required])),
  )
  const [sent, setSent] = useState(false)
  const id = useId()
  const optional = CONSENTS.filter((c) => !c.required && checked[c.id]).map((c) => c.short)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSent(true)
  }

  const row = (c: (typeof CONSENTS)[number]) => (
    <div key={c.id} className="flex items-center gap-2">
      <Checkbox
        id={`${id}-${c.id}`}
        checked={checked[c.id]}
        disabled={sent}
        onCheckedChange={(v) => setChecked((s) => ({ ...s, [c.id]: v === true }))}
      />
      <Label htmlFor={`${id}-${c.id}`} className="font-normal">
        {c.label}
      </Label>
    </div>
  )
  const optionalRows = <div className="flex flex-col gap-2.5 p-1">{CONSENTS.filter((c) => !c.required).map(row)}</div>

  return (
    <>
      <BrowserFrame url="trip.example/signup" className="min-h-[22rem]">
        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          <p className="text-lg font-semibold">가입하고 제주 특가 받기</p>
          {row(CONSENTS[0])}
          {honest ? (
            <Flag honest note="선택 항목은 비워 두고, 원하는 사람만 직접 체크해요.">
              {optionalRows}
            </Flag>
          ) : (
            <Flag note="선택 항목인데 이미 체크되어 있어요. 읽지 않고 가입하면 모두 동의한 것이 돼요.">{optionalRows}</Flag>
          )}
          {sent ? (
            <p className={done}>
              <CheckCircle2Icon aria-hidden className="size-4" />
              가입했어요.
            </p>
          ) : (
            <Button type="submit" size="lg" disabled={!checked.terms}>
              가입하기
            </Button>
          )}
        </form>
      </BrowserFrame>
      <Status honest={honest}>
        {sent ? '가입함' : `필수 동의 ${checked.terms ? '함' : '안 함'}`} · 동의된 선택 항목 {optional.length}개
        {optional.length > 0 && `: ${optional.join(', ')}`}
      </Status>
    </>
  )
}

/** 3. Confirmshaming: the way to say no is worded to make you feel bad. */
function Confirmshaming({ honest }: Version) {
  const [open, setOpen] = useState(true)
  const [choice, setChoice] = useState<string | null>(null)
  const titleId = useId()
  const decline = honest ? '괜찮아요' : '아니요, 할인은 필요 없어요. 비싸게 살래요'

  const choose = (label: string) => {
    setChoice(label)
    setOpen(false)
  }

  return (
    <>
      <BrowserFrame url="trip.example/jeju" className="h-[22rem]">
        <div className="flex flex-col gap-3 p-5">
          <p className="text-lg font-semibold">제주 특가 숙소</p>
          <div aria-hidden className="h-20 rounded-lg bg-gradient-to-br from-sky-100 to-teal-200 dark:from-sky-500/20 dark:to-teal-500/25" />
          <ContentSketch rows={3} />
          {!open && (
            <div className="flex items-center gap-2 text-sm">
              <span>{choice === '쿠폰 받기' ? '10% 쿠폰을 받았어요.' : '쿠폰 없이 둘러보는 중'}</span>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                팝업 다시 보기
              </Button>
            </div>
          )}
        </div>
        {open && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 p-4">
            <div role="dialog" aria-labelledby={titleId} className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-background p-5 text-center shadow-lg">
              <p id={titleId} className="text-base font-semibold">
                제주 특가 10% 쿠폰을 드려요
              </p>
              <p className="text-sm text-muted-foreground">이번 주 예약에만 쓸 수 있어요.</p>
              {honest ? (
                <Flag honest note="두 선택지를 같은 크기, 같은 말투로 둬요.">
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => choose('쿠폰 받기')}>쿠폰 받기</Button>
                    <Button variant="outline" onClick={() => choose(decline)}>
                      {decline}
                    </Button>
                  </div>
                </Flag>
              ) : (
                <>
                  <Button size="lg" onClick={() => choose('쿠폰 받기')}>
                    쿠폰 받기
                  </Button>
                  <Flag note="거절 문구가 거절하는 사람을 깎아내려요. 미안해서 ‘예’를 누르게 하는 수법이에요.">
                    <button type="button" className="text-xs text-muted-foreground underline" onClick={() => choose(decline)}>
                      {decline}
                    </button>
                  </Flag>
                </>
              )}
            </div>
          </div>
        )}
      </BrowserFrame>
      <Status honest={honest}>{open ? '팝업 열림 · 아직 고르지 않음' : `팝업 닫힘 · 누른 버튼: ‘${choice}’`}</Status>
    </>
  )
}

const TRIAL_DAYS = 3
const MONTHLY = 9900

/** 8. Forced continuity: the free trial quietly turns into a paid plan. */
function ForcedContinuity({ honest }: Version) {
  const [day, setDay] = useState(0)
  const [autoRenew, setAutoRenew] = useState(true)
  const ended = day > TRIAL_DAYS
  const charged = ended && autoRenew ? MONTHLY : 0
  const reminders = honest && day >= TRIAL_DAYS ? 1 : 0

  return (
    <>
      <BrowserFrame url="trip.example/plus/trial" className="min-h-[22rem]">
        <div className="flex flex-col gap-3 p-5">
          <div>
            <p className="text-lg font-semibold">모아 트래블 플러스 {TRIAL_DAYS}일 무료 체험</p>
            <p className="text-sm text-muted-foreground">라운지 할인, 무료 수하물 1개</p>
          </div>
          {day === 0 ? (
            <>
              {honest ? (
                <Flag honest note="언제부터 얼마가 나가는지 본문 크기로 먼저 알리고, 끝나기 전에 알려 줘요.">
                  <p className="p-1 text-sm">
                    {TRIAL_DAYS + 1}일째부터 월 {won(MONTHLY)}이 등록된 카드로 결제돼요. 끝나기 하루 전에 알려 드리고, 언제든 한 번에 끌 수 있어요.
                  </p>
                </Flag>
              ) : (
                <Flag note="유료로 바뀐다는 말이 버튼 아래 아주 작은 글씨에만 있어요.">
                  <p className="text-[10px] leading-snug text-muted-foreground/70">
                    체험 종료 후 등록된 결제 수단으로 월 {won(MONTHLY)}이 자동 청구되며, 해지는 설정 &gt; 계정 &gt; 구독 관리 &gt; 멤버십에서 가능합니다.
                  </p>
                </Flag>
              )}
              <Button size="lg" className="self-start" onClick={() => setDay(1)}>
                {honest ? '무료 체험 시작' : '0원으로 시작하기'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">{ended ? '체험이 끝났어요' : `체험 ${day}일째`}</p>
              {honest && !ended && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
                  <span>자동 결제: {autoRenew ? '켜짐' : '꺼짐'}</span>
                  <Button size="sm" variant="outline" onClick={() => setAutoRenew((v) => !v)}>
                    자동 결제 {autoRenew ? '끄기' : '켜기'}
                  </Button>
                </div>
              )}
              {reminders > 0 && !ended && (
                <Flag honest note="결제되기 전에 미리 알려 주고, 그 자리에서 끌 수 있게 해요.">
                  <p className="flex items-center gap-2 p-1 text-sm">
                    <BellIcon aria-hidden className="size-4" />
                    {autoRenew ? `내일 체험이 끝나요. 계속 쓰면 월 ${won(MONTHLY)}이 결제돼요.` : '내일 체험이 끝나요. 자동 결제는 꺼져 있어요.'}
                  </p>
                </Flag>
              )}
              {ended &&
                (charged > 0 ? (
                  honest ? (
                    <p className="flex items-center gap-2 text-sm">
                      <ReceiptIcon aria-hidden className="size-4" />
                      알려 드린 대로 {won(MONTHLY)}이 결제됐어요.
                    </p>
                  ) : (
                    <Flag note="아무 알림 없이 체험이 유료로 바뀌어 돈이 나갔어요.">
                      <p className="flex items-center gap-2 p-1 text-sm">
                        <ReceiptIcon aria-hidden className="size-4" />
                        카드 결제 {won(MONTHLY)} · 모아 트래블 플러스
                      </p>
                    </Flag>
                  )
                ) : (
                  <p className={done}>결제되지 않았어요. 체험만 하고 끝났어요.</p>
                ))}
              <Button variant="outline" className="self-start" disabled={ended} onClick={() => setDay((d) => d + 1)}>
                하루 지나기 (시연)
              </Button>
            </>
          )}
        </div>
      </BrowserFrame>
      <Status honest={honest}>
        체험: {day === 0 ? '시작 전' : ended ? '끝남' : `${day}일째`} · 미리 받은 알림 {reminders}번 · 결제 {won(charged)}
      </Status>
    </>
  )
}

const DEALS = ['오사카 항공권', '제주 렌터카', '도쿄 호텔', '방콕 패키지']

/** 9. Nagging: "later" only means "on the next screen". */
function Nagging({ honest }: Version) {
  const [screen, setScreen] = useState(0)
  const [open, setOpen] = useState(true)
  const [asked, setAsked] = useState(1)
  const [laterCount, setLaterCount] = useState(0)
  const [answer, setAnswer] = useState<'on' | 'later' | 'never' | null>(null)
  const titleId = useId()

  const next = () => {
    setScreen((s) => (s + 1) % DEALS.length)
    if (!honest && answer !== 'on') {
      setOpen(true)
      setAsked((a) => a + 1)
    }
  }
  const reply = (a: 'on' | 'later' | 'never') => {
    if (a === 'later') setLaterCount((n) => n + 1)
    setAnswer(a)
    setOpen(false)
  }

  return (
    <>
      <div className="flex justify-center">
        <PhoneFrame className="h-[26rem]">
          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm font-semibold">모아 트래블</p>
            <p className="text-lg font-semibold">{DEALS[screen]} 특가</p>
            <div aria-hidden className="h-24 rounded-lg bg-muted" />
            <ContentSketch rows={3} />
            <Button variant="outline" onClick={next}>
              다음 특가 보기
            </Button>
          </div>
          {open && (
            <div className="absolute inset-0 flex items-end bg-black/40">
              <div role="dialog" aria-labelledby={titleId} className="flex w-full flex-col gap-2 rounded-t-2xl bg-background p-4">
                {!honest && (
                  <span className="self-start rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">{asked}번째 권유</span>
                )}
                <p id={titleId} className="font-semibold">
                  알림을 켜시겠어요?
                </p>
                <p className="text-sm text-muted-foreground">특가가 열리면 바로 알려 드려요.</p>
                <Button onClick={() => reply('on')}>알림 켜기</Button>
                {honest ? (
                  <Flag honest note="‘다시 묻지 않기’가 있고, ‘나중에’를 눌러도 이번 방문에는 다시 묻지 않아요.">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => reply('later')}>
                        나중에
                      </Button>
                      <Button variant="outline" onClick={() => reply('never')}>
                        다시 묻지 않기
                      </Button>
                    </div>
                  </Flag>
                ) : (
                  <Flag note="‘나중에’를 눌러도 화면을 넘길 때마다 다시 떠요. ‘다시 묻지 않기’는 없어요.">
                    <Button variant="ghost" className="w-full" onClick={() => reply('later')}>
                      나중에
                    </Button>
                  </Flag>
                )}
              </div>
            </div>
          )}
        </PhoneFrame>
      </div>
      <Status honest={honest}>
        {DEALS[screen]} 화면 · 권유 {asked}번 · ‘나중에’ {laterCount}번 · 알림{' '}
        {answer === 'on' ? '켜짐' : answer === 'never' ? '꺼짐 (다시 묻지 않음)' : '꺼짐'}
      </Status>
    </>
  )
}

export const RoachMotelFormat = () => <Compare Demo={RoachMotel} />
export const PreCheckedFormat = () => <Compare Demo={PreChecked} />
export const ConfirmshamingFormat = () => <Compare Demo={Confirmshaming} />
export const ForcedContinuityFormat = () => <Compare Demo={ForcedContinuity} />
export const NaggingFormat = () => <Compare Demo={Nagging} />
