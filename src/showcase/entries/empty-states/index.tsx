import type { ReactNode } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StateGrid } from '../../state-grid'
import type { ShowcaseEntry } from '../../types'
import { DoneArt, FolderArt, LockArt, NotFoundArt, OfflineArt, SearchArt, ServerArt } from './art'
import {
  AfterDeleteFormat,
  AllDoneFormat,
  FilterNoResultsFormat,
  FirstUseFormat,
  LockedFormat,
  NoAccessFormat,
  NoMatchFormat,
  NotFoundFormat,
  OfflineFormat,
  PermissionRequestFormat,
  ServerErrorFormat,
} from './formats'
import { EmptyState } from './parts'

const small = 'h-14 w-[4.375rem]'

/** One small card per kind of empty screen; the button is part of the drawing. */
function Card({ art, title, line, action }: { art: ReactNode; title: string; line: string; action: string }) {
  return (
    <div className="w-full max-w-64 rounded-lg border bg-background">
      <EmptyState compact art={art} title={title} description={line}>
        <Button size="xs" variant="outline" tabIndex={-1}>
          {action}
        </Button>
      </EmptyState>
    </div>
  )
}

function States() {
  return (
    <StateGrid
      wide
      items={[
        {
          label: '처음 (아직 없음)',
          node: <Card art={<FolderArt className={small} />} title="아직 프로젝트가 없어요" line="첫 프로젝트를 만들어 보세요." action="프로젝트 만들기" />,
        },
        {
          label: '검색 결과 없음',
          node: <Card art={<SearchArt className={small} />} title="‘영수증’ 검색 결과가 없어요" line="다른 낱말로 찾아보세요." action="검색어 지우기" />,
        },
        {
          label: '모두 완료',
          node: <Card art={<DoneArt className={small} />} title="할 일을 모두 끝냈어요" line="오늘은 여기까지!" action="할 일 추가" />,
        },
        {
          label: '페이지 없음 (404)',
          node: <Card art={<NotFoundArt className={small} />} title="페이지를 찾을 수 없어요" line="주소를 다시 확인해 주세요." action="홈으로" />,
        },
        {
          label: '권한 없음 (403)',
          node: <Card art={<LockArt className={small} />} title="볼 권한이 없어요" line="문서 주인에게 요청할 수 있어요." action="권한 요청" />,
        },
        {
          label: '오프라인',
          node: <Card art={<OfflineArt className={small} />} title="인터넷에 연결되어 있지 않아요" line="연결되면 저절로 다시 불러와요." action="다시 시도" />,
        },
        {
          label: '서버 오류 (500)',
          node: <Card art={<ServerArt className={small} />} title="불러오지 못했어요" line="저희 쪽 문제예요. 잠시 뒤 다시 시도해 주세요." action="다시 시도" />,
        },
      ]}
    />
  )
}

function EmptyStatesSpecimen() {
  return (
    <div className="w-80 rounded-lg border bg-background">
      <EmptyState
        slots
        art={<FolderArt />}
        title="아직 프로젝트가 없어요"
        description="프로젝트를 만들면 할 일·파일·대화를 한곳에 모을 수 있어요."
      >
        <Button data-slot="empty-action" tabIndex={-1}>
          <PlusIcon data-icon="inline-start" />첫 프로젝트 만들기
        </Button>
        <Button data-slot="empty-secondary" variant="ghost" tabIndex={-1}>
          예시로 시작하기
        </Button>
      </EmptyState>
    </div>
  )
}

function EmptyStatesPreview() {
  return (
    <div aria-hidden className="flex w-40 flex-col items-center gap-1.5 rounded-lg border border-dashed bg-background px-3 py-3">
      <FolderArt className="h-10 w-[3.125rem]" />
      <span className="h-1.5 w-20 rounded-full bg-foreground/70" />
      <span className="h-1.5 w-24 rounded-full bg-muted-foreground/30" />
      <span className="mt-1 h-4 w-14 rounded-md bg-foreground" />
    </div>
  )
}

export const emptyStatesEntry: ShowcaseEntry = {
  id: 'empty-states',
  name: 'Empty States',
  aliases: [
    'Empty state',
    'Zero state',
    'Blank slate',
    'First use',
    'No results',
    'All done',
    '404',
    'Not found',
    'Permission denied',
    'Offline',
    'Error page',
    'No filter results',
    'Permission request',
    'After delete',
    'Locked state',
    '빈 화면',
    '빈 상태',
    '첫 사용',
    '검색 결과 없음',
    '모두 완료',
    '페이지 없음',
    '권한 없음',
    '오프라인',
    '서버 오류',
    '필터 결과 없음',
    '권한 요청',
    '삭제 직후',
    '잠김',
  ],
  description: '보여 줄 내용이 없을 때 그 까닭(아직 없음·결과 없음·다 끝냄·오류)에 맞는 그림과 한 줄 설명, 다음 행동으로 빈 화면을 채우는 형식.',
  category: 'feedback',
  Preview: EmptyStatesPreview,
  anatomy: {
    Specimen: EmptyStatesSpecimen,
    parts: [
      { slot: 'empty-state', name: 'Empty state', description: '내용 대신 그 자리를 채우는 블록 전체' },
      { slot: 'empty-art', name: 'Illustration', description: '어떤 빈 화면인지 한눈에 알리는 그림. 꾸밈이라 화면 낭독기는 건너뜀' },
      { slot: 'empty-title', name: 'Title', description: '무슨 일인지 한 줄로. 탓하지 않고 쉬운 말로' },
      { slot: 'empty-description', name: 'Description', description: '왜 비었는지, 무엇을 하면 되는지 한 문장' },
      { slot: 'empty-action', name: 'Primary action', description: '빈 화면에서 벗어나게 하는 가장 중요한 버튼 하나' },
      { slot: 'empty-secondary', name: 'Secondary action', description: '다른 길. 예시 보기, 도움말, 고객센터 같은 것' },
    ],
  },
  examples: [
    {
      title: '상태 모음',
      description:
        '빈 화면은 까닭에 따라 네 갈래입니다. 아직 아무것도 없음(처음), 찾았지만 없음(검색 결과 없음), 다 해서 없음(모두 완료), 가져오지 못함(페이지 없음·권한 없음·오프라인·서버 오류). 까닭마다 그림·말투·버튼이 달라집니다.',
      Demo: States,
    },
    {
      title: '첫 사용',
      description:
        '아직 아무것도 만들지 않아 비어 있는 화면입니다. 잘못된 것이 아니므로 반기는 말투로 무엇을 할 수 있는 곳인지 알려 주고, 첫 항목을 만드는 버튼 하나를 크게 둡니다. 데이터가 있어야 의미 있는 화면(통계 등)이라면 예시 데이터로 시작하게 해도 좋습니다. 첫 프로젝트 만들기를 눌러 목록으로 바뀌는 것을 보세요.',
      Demo: FirstUseFormat,
    },
    {
      title: '검색 결과 없음',
      description:
        '내용은 있는데 지금 검색어나 필터에 맞는 것이 없을 때입니다. 처음 화면과 달리 무엇을 찾았는지 그대로 보여 주고, 검색어 지우기처럼 원래 목록으로 돌아갈 길을 줍니다. 검색칸을 고쳐 결과가 나오게 하거나 검색어 지우기를 눌러 보세요.',
      Demo: NoMatchFormat,
    },
    {
      title: '필터 결과 없음',
      description:
        '검색어가 아니라 고른 필터(조건) 때문에 목록이 빈 경우입니다. 어떤 조건들이 겹쳐 비었는지 칩 이름을 그대로 보여 주고, 전부 지우는 필터 초기화와 하나만 빼는 버튼을 함께 둡니다. 하나를 뺄 때 몇 개가 나오는지 미리 적고, 가장 가까운 상품도 알려 주면 막다른 길이 되지 않습니다. 조건 하나를 빼거나 위의 칩을 직접 눌러 보세요.',
      Demo: FilterNoResultsFormat,
    },
    {
      title: '모두 완료',
      description:
        '할 일을 다 해서 비었을 때입니다. 빈 목록은 실패가 아니라 끝냈다는 신호이므로 축하하는 그림과 말을 쓰고, 다음에 할 수 있는 일을 하나 둡니다. 남은 두 개를 체크해 마지막 하나를 끝내 보세요. 움직임 줄이기를 켠 기기에서는 축하 효과가 움직이지 않습니다.',
      Demo: AllDoneFormat,
    },
    {
      title: '삭제 직후',
      description:
        '사용자가 방금 지워서 빈 화면입니다. 처음 화면처럼 반기는 대신 무엇을 지웠는지 확인해 주고, 몇 초 동안 되돌리기를 둡니다. 지우기 전에 묻는 확인 창보다 지운 뒤 되돌리기가 덜 번거롭습니다. 휴지통 비우기를 누르거나 파일을 하나씩 지워 마지막 하나를 지웠을 때와 비교해 보세요. 되돌리기는 5초 뒤 사라집니다.',
      Demo: AfterDeleteFormat,
    },
    {
      title: '404 페이지 없음',
      description:
        '주소가 틀렸거나 페이지가 사라져서 보여 줄 것이 없을 때입니다(상태 코드 404). 사용자를 탓하지 않고, 홈으로·사이트 검색·비슷한 페이지 링크로 빠져나갈 길을 줍니다. 주소창의 오타(evnets)를 보고, 홈으로·검색·추천 링크를 각각 눌러 본 뒤 뒤로 가기로 돌아와 보세요.',
      Demo: NotFoundFormat,
    },
    {
      title: '권한 없음',
      description:
        '페이지는 있지만 이 계정으로는 볼 수 없을 때입니다(403). 로그인 자체가 안 된 경우(401)와 달리 어떤 계정으로 들어와 있는지, 누구에게 권한을 받으면 되는지 알려 주고 요청 버튼을 둡니다. 권한 요청을 보내고, 시연용 승인을 눌러 문서가 열리는 것을 보세요.',
      Demo: NoAccessFormat,
    },
    {
      title: '권한 요청',
      description:
        '앱이 기기 권한(알림·위치·사진 등)을 받아야 쓸 수 있는 기능이 비어 있을 때입니다. 볼 수 없다는 권한 없음(403)과 달리, 이쪽은 앱이 사용자에게 허락을 구하는 화면입니다. 시스템 창을 바로 띄우지 않고 무엇이 좋아지는지 먼저 설명한 뒤 묻고, 거절되면 앱이 다시 물을 수 없으므로 설정에서 켜는 길을 알려 줍니다. 알림 켜기를 눌러 허용과 허용 안 함을 각각 골라 보세요.',
      Demo: PermissionRequestFormat,
    },
    {
      title: '오프라인',
      description:
        '인터넷이 끊겨 새 내용을 가져올 수 없을 때입니다. 앱 고장이 아니라 연결 문제라는 것을 분명히 하고, 다시 시도와 저장해 둔 내용 보기처럼 끊긴 채로도 할 수 있는 일을 줍니다. 연결이 돌아오면 저절로 다시 불러오는 것이 좋습니다. 스위치로 연결을 끊고, 다시 시도해 본 뒤 연결을 켜 보세요.',
      Demo: OfflineFormat,
    },
    {
      title: '서버 오류',
      description:
        '사용자 잘못이 아니라 서비스 쪽 문제로 불러오지 못했을 때입니다(500대 오류). 미안하다는 쉬운 말과 다시 시도 버튼, 그리고 고객센터에 알려 줄 오류 코드를 보여 줍니다. 이 예시의 서버는 첫 번째 다시 시도에서 한 번 더 실패한 뒤 회복합니다. 오류 코드를 복사하고, 다시 시도를 두 번 눌러 보세요.',
      Demo: ServerErrorFormat,
    },
    {
      title: '잠김',
      description:
        '내용은 있지만 조건을 채워야 열리는 기능입니다. 자물쇠만 보여 주지 말고 무엇을 하면 열리는지, 지금 얼마나 왔는지(1/3)를 함께 보여 줘야 다음 행동이 보입니다. 아래 상품을 담아 3만 원을 채우면 쿠폰이 열리고, 다시 빼면 잠깁니다.',
      Demo: LockedFormat,
    },
  ],
}
