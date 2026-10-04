import { Transaction } from '../types/transaction';

export const INITIAL_MOCK_TRANSACTIONS: Transaction[] = [
  // 2026년 9월 데이터는 사용자 요청으로 가짜(Mock) 데이터 전체 삭제됨 (0건으로 시작)

  // 2026년 8월 데이터 (월 이동 비교용 참고 데이터)
  {
    id: 'tx-aug-01',
    type: 'income',
    date: '2026-08-25',
    time: '09:00',
    mainCategory: '급여',
    subCategory: '월급',
    content: '(주)테크솔루션 8월 급여',
    description: '(주)테크솔루션 8월 급여',
    amount: 4200000,
    createdAt: '2026-08-25T09:00:00Z',
  },
  {
    id: 'tx-aug-02',
    type: 'expense',
    date: '2026-08-25',
    time: '10:00',
    mainCategory: '주거/통신',
    subCategory: '월세/관리비',
    content: '8월 월세 이체',
    description: '8월 월세 이체',
    amount: 650000,
    createdAt: '2026-08-25T10:00:00Z',
  },
  {
    id: 'tx-aug-03',
    type: 'expense',
    date: '2026-08-15',
    time: '18:00',
    mainCategory: '여행/휴가',
    subCategory: '숙박',
    content: '제주도 여름 휴가 호텔',
    description: '제주도 여름 휴가 호텔',
    amount: 340000,
    createdAt: '2026-08-15T18:00:00Z',
  },
];
