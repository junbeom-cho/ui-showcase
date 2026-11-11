import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ShowcaseEntry } from '../types'

function CardPreview() {
  return (
    <Card size="sm" className="w-full max-w-56">
      <CardHeader>
        <CardTitle>프로젝트</CardTitle>
        <CardDescription>최근 수정 2일 전</CardDescription>
      </CardHeader>
      <CardContent>컴포넌트 쇼케이스 작업 중</CardContent>
      <CardFooter>
        <Button size="sm">열기</Button>
      </CardFooter>
    </Card>
  )
}

export const cardEntry: ShowcaseEntry = {
  id: 'card',
  name: 'Card',
  aliases: ['Panel', 'Tile', '카드'],
  description: '관련 정보를 테두리가 있는 하나의 상자로 묶은 컨테이너.',
  Preview: CardPreview,
}
