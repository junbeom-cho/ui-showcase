import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { ShowcaseEntry } from '../types'

function AlertPreview() {
  return (
    <Alert className="w-full">
      <AlertTitle>저장되지 않았습니다</AlertTitle>
      <AlertDescription>변경 사항을 저장하려면 저장 버튼을 누르세요.</AlertDescription>
    </Alert>
  )
}

export const alertEntry: ShowcaseEntry = {
  id: 'alert',
  name: 'Alert',
  aliases: ['Callout', 'Banner', 'Notice', '알림'],
  description: '주의가 필요한 메시지를 페이지 안에서 눈에 띄게 보여주는 상자.',
  Preview: AlertPreview,
}
