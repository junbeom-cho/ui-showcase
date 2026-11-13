import { useEffect, useId, useState } from 'react'
import { CheckCircle2Icon, EyeIcon, RotateCwIcon, TimerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BrowserFrame } from '../navigation-patterns/frames'
import { Compare, Flag, Status, won } from './parts'

type Version = { honest: boolean }

const done = 'flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'

function ReloadButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="self-start" onClick={onClick}>
      <RotateCwIcon data-icon="inline-start" />
      새로고침 (시연)
    </Button>
  )
}

/** Seconds the fake timer starts from; it shows 00:00 for a second, then starts again. */
const COUNTDOWN_FROM = 20

/** 3. Fake countdown: a deadline that starts over on every visit and every time it runs out. */
function FakeCountdown({ honest }: Version) {
  const [elapsed, setElapsed] = useState(0)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (honest) return
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [honest, reloads])

  const left = COUNTDOWN_FROM - (elapsed % (COUNTDOWN_FROM + 1))
  const restarts = Math.floor(elapsed / (COUNTDOWN_FROM + 1))
  const reload = () => {
    setReloads((r) => r + 1)
    setElapsed(0)
  }

  return (
    <>
      <BrowserFrame url="trip.example/deal/osaka" className="min-h-[18rem]">
        <div className="flex flex-col gap-3 p-5">
          <p className="text-lg font-semibold">오사카 왕복 항공권 특가</p>
          <p className="text-sm">
            <span className="text-xl font-bold">{won(189000)}</span>{' '}
            <span className="text-muted-foreground line-through">{won(320000)}</span>
          </p>
          {honest ? (
            <Flag honest note="정해진 마감 날짜를 보여 줘요. 새로고침해도 바뀌지 않아요." className="self-start">
              <p className="flex items-center gap-1.5 px-1 text-sm">
                <TimerIcon aria-hidden className="size-4" />
                특가 기간: 11월 20일 23:59까지
              </p>
            </Flag>
          ) : (
            <Flag note="새로고침하거나 0이 되면 처음부터 다시 시작해요. 진짜 마감이 아니에요." className="self-start">
              <p role="timer" className="flex items-center gap-1.5 rounded-md bg-red-500 px-2.5 py-1 text-sm font-semibold text-white tabular-nums">
                <TimerIcon aria-hidden className="size-4" />
                마감 임박 00:{String(left).padStart(2, '0')}
              </p>
            </Flag>
          )}
        </div>
      </BrowserFrame>
      <ReloadButton onClick={reload} />
      <Status honest={honest}>
        새로고침 {reloads}번 · {honest ? '마감 11월 20일 23:59 그대로' : `시계가 0에서 다시 시작한 횟수 ${restarts}번`} · 가격{' '}
        {won(189000)} 그대로
      </Status>
    </>
  )
}

const FLIGHT = 189000
const INSURANCE = 12900

/** 5. Sneak into basket: an extra you never chose is already in the cart. */
function SneakIntoBasket({ honest }: Version) {
  const [step, setStep] = useState<'product' | 'cart' | 'paid'>('product')
  const [insured, setInsured] = useState(false)
  const id = useId()
  const total = FLIGHT + (insured ? INSURANCE : 0)
  const unchosen = !honest && insured ? 1 : 0
  const names = step === 'product' ? [] : ['오사카 왕복 항공권', ...(insured ? ['여행자 보험'] : [])]

  const addToCart = () => {
    setInsured(!honest)
    setStep('cart')
  }

  return (
    <>
      <BrowserFrame url={step === 'product' ? 'trip.example/flight/osaka' : 'trip.example/cart'} className="min-h-[20rem]">
        <div className="flex flex-col gap-3 p-5">
          {step === 'product' && (
            <>
              <p className="text-lg font-semibold">오사카 왕복 항공권</p>
              <p className="text-sm text-muted-foreground">12월 5일–8일 · 인천 ↔ 간사이 · 성인 1명</p>
              <p className="text-xl font-bold">{won(FLIGHT)}</p>
              <Button size="lg" className="self-start" onClick={addToCart}>
                장바구니에 담기
              </Button>
            </>
          )}
          {step !== 'product' && (
            <>
              <p className="text-lg font-semibold">장바구니</p>
              <ul aria-label="장바구니" className="flex flex-col gap-3">
                <li className="flex justify-between text-sm">
                  <span>오사카 왕복 항공권</span>
                  <span>{won(FLIGHT)}</span>
                </li>
                {!honest && insured && (
                  <li>
                    <Flag note="담은 적 없는 보험이 저절로 들어왔어요. 빼려면 작은 ‘삭제’를 찾아야 해요.">
                      <div className="flex items-center justify-between gap-2 p-1 text-sm">
                        <span>
                          여행자 보험 (추천){' '}
                          {step === 'cart' && (
                            <button type="button" aria-label="여행자 보험 삭제" className="text-[10px] text-muted-foreground/70 underline" onClick={() => setInsured(false)}>
                              삭제
                            </button>
                          )}
                        </span>
                        <span>{won(INSURANCE)}</span>
                      </div>
                    </Flag>
                  </li>
                )}
                {honest && insured && (
                  <li className="flex justify-between text-sm">
                    <span>여행자 보험</span>
                    <span>{won(INSURANCE)}</span>
                  </li>
                )}
              </ul>
              {honest && step === 'cart' && (
                <Flag honest note="추가 상품은 체크하지 않은 채로 보여 주고, 원하는 사람만 담게 해요.">
                  <div className="flex items-center gap-2 p-1">
                    <Checkbox id={id} checked={insured} onCheckedChange={(v) => setInsured(v === true)} />
                    <Label htmlFor={id} className="font-normal">
                      여행자 보험 추가 (+{won(INSURANCE)})
                    </Label>
                  </div>
                </Flag>
              )}
              <p className="flex justify-between border-t pt-2 font-semibold">
                <span>합계</span>
                <span>{won(total)}</span>
              </p>
              {step === 'paid' ? (
                <p className={done}>
                  <CheckCircle2Icon aria-hidden className="size-4" />
                  {won(total)}을 결제했어요.
                </p>
              ) : (
                <Button size="lg" onClick={() => setStep('paid')}>
                  {won(total)} 결제하기
                </Button>
              )}
            </>
          )}
        </div>
      </BrowserFrame>
      <Status honest={honest}>
        {step === 'paid' ? '결제함' : step === 'cart' ? '장바구니' : '상품 보는 중'} · 담긴 상품 {names.length > 0 ? names.join(', ') : '없음'} · 합계{' '}
        {won(step === 'product' ? 0 : total)} · 직접 고르지 않은 상품 {unchosen}개
      </Status>
    </>
  )
}

const ROOMS = 5
const FAKE_LEFT = 2
const VIEWERS = [37, 41, 29, 44]

/** 6. Fake scarcity: "only 2 left" no matter how many are booked. */
function FakeScarcity({ honest }: Version) {
  const [reloads, setReloads] = useState(0)
  const [booked, setBooked] = useState(0)
  const real = ROOMS - booked
  const shown = honest ? real : FAKE_LEFT

  return (
    <>
      <BrowserFrame url="trip.example/hotel/jeju-ocean" className="min-h-[18rem]">
        <div className="flex flex-col gap-3 p-5">
          <p className="text-lg font-semibold">제주 오션뷰 호텔 · 디럭스 더블</p>
          <p className="text-sm text-muted-foreground">12월 12일 1박 · {won(148000)}</p>
          {honest ? (
            <Flag honest note="실제 남은 객실 수를 보여 주고, 예약하면 그만큼 줄어요." className="self-start">
              <p className="px-1 text-sm">{real > 0 ? `남은 객실 ${real}개` : '매진됐어요'}</p>
            </Flag>
          ) : (
            <Flag note="새로고침하고 몇 번을 예약해도 ‘2개’ 그대로예요. 보고 있다는 사람 수도 지어낸 숫자예요." className="self-start">
              <div className="flex flex-col gap-1 px-1 text-sm font-semibold text-red-600 dark:text-red-400">
                <span>남은 객실 단 {FAKE_LEFT}개!</span>
                <span className="flex items-center gap-1 font-normal">
                  <EyeIcon aria-hidden className="size-3.5" />
                  지금 {VIEWERS[reloads % VIEWERS.length]}명이 보고 있어요
                </span>
              </div>
            </Flag>
          )}
          <Button size="lg" className="self-start" disabled={honest && real === 0} onClick={() => setBooked((b) => b + 1)}>
            예약하기
          </Button>
        </div>
      </BrowserFrame>
      <ReloadButton onClick={() => setReloads((r) => r + 1)} />
      <Status honest={honest}>
        새로고침 {reloads}번 · 예약한 객실 {booked}개 · 화면의 남은 객실 {shown}개
      </Status>
    </>
  )
}

const RENTAL = 99000
const FEES = [
  { name: '필수 보험료', price: 15000 },
  { name: '예약 수수료', price: 8900 },
  { name: '공항 픽업비', price: 5000 },
]
const RENTAL_TOTAL = RENTAL + FEES.reduce((sum, f) => sum + f.price, 0)
const STEPS = ['상품', '운전자 정보', '결제']

function Breakdown() {
  return (
    <ul aria-label="요금 내역" className="flex flex-col gap-1.5 p-1 text-sm">
      <li className="flex justify-between">
        <span>렌터카 3일</span>
        <span>{won(RENTAL)}</span>
      </li>
      {FEES.map((f) => (
        <li key={f.name} className="flex justify-between">
          <span>{f.name}</span>
          <span>{won(f.price)}</span>
        </li>
      ))}
    </ul>
  )
}

/** 7. Hidden costs: the fees turn up only on the last step, after the effort is spent. */
function HiddenCosts({ honest }: Version) {
  const [step, setStep] = useState(0)
  const firstSeen = honest ? RENTAL_TOTAL : RENTAL
  const now = honest || step >= 2 ? RENTAL_TOTAL : RENTAL

  return (
    <>
      <BrowserFrame url="trip.example/car/jeju" className="min-h-[22rem]">
        <div className="flex flex-col gap-3 p-5">
          <p className="text-xs text-muted-foreground">{step < 3 ? `${step + 1}/3 단계 · ${STEPS[step]}` : '완료'}</p>
          {step === 0 && (
            <>
              <p className="text-lg font-semibold">제주 렌터카 3일 · 소형 SUV</p>
              {honest ? (
                <Flag honest note="처음부터 꼭 내야 하는 비용을 모두 더한 총액을 보여 줘요.">
                  <p className="px-1 text-xl font-bold">총 {won(RENTAL_TOTAL)}</p>
                  <Breakdown />
                </Flag>
              ) : (
                <p className="text-xl font-bold">{won(RENTAL)}</p>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <p className="text-lg font-semibold">운전자 정보</p>
              <p className="text-sm text-muted-foreground">김하늘 · 1종 보통 · 저장된 정보로 채웠어요</p>
              <p className="text-sm">지금까지 금액 {won(now)}</p>
            </>
          )}
          {step === 2 &&
            (honest ? (
              <Breakdown />
            ) : (
              <Flag note="마지막 결제 단계에서야 처음 나온 비용이에요. 여기까지 온 사람은 그냥 결제하기 쉬워요.">
                <Breakdown />
              </Flag>
            ))}
          {step === 2 && (
            <p className="flex justify-between border-t pt-2 font-semibold">
              <span>합계</span>
              <span>{won(now)}</span>
            </p>
          )}
          {step === 3 && (
            <p className={done}>
              <CheckCircle2Icon aria-hidden className="size-4" />
              {won(now)}을 결제했어요.
            </p>
          )}
          {step < 3 && (
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  이전
                </Button>
              )}
              <Button onClick={() => setStep((s) => s + 1)}>{step === 2 ? `${won(now)} 결제하기` : '다음'}</Button>
            </div>
          )}
        </div>
      </BrowserFrame>
      <Status honest={honest}>
        {step < 3 ? `${step + 1}/3 단계` : '결제함'} · 처음 본 가격 {won(firstSeen)} · 지금 가격 {won(now)} (+{won(now - firstSeen)})
      </Status>
    </>
  )
}

export const FakeCountdownFormat = () => <Compare Demo={FakeCountdown} />
export const SneakIntoBasketFormat = () => <Compare Demo={SneakIntoBasket} />
export const FakeScarcityFormat = () => <Compare Demo={FakeScarcity} />
export const HiddenCostsFormat = () => <Compare Demo={HiddenCosts} />
