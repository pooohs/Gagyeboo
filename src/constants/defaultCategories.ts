import { CategoryLookup } from '../types/transaction';

// 기본 지출 2단계 카테고리 (12개 대분류)
export const DEFAULT_EXPENSE_CATEGORIES: CategoryLookup = {
  '식비': {
    subCategories: ['외식', '식재료(마트)', '배달', '카페/간식'],
    color: '#f97316', // Orange
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  '주거/통신': {
    subCategories: ['월세/관리비', '공과금', '통신비'],
    color: '#3b82f6', // Blue
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  '생활/용품': {
    subCategories: ['생활용품', '가전/가구', '의류/미용'],
    color: '#10b981', // Emerald
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  '쇼핑': {
    subCategories: ['백화점/아울렛', '온라인쇼핑', '멤버십/포인트'],
    color: '#ec4899', // Pink
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
  },
  '교통/차량': {
    subCategories: ['대중교통(버스/지하철)', '기차/고속버스', '전기차충전/주유', '통행료/주차', '차량정비'],
    color: '#06b6d4', // Cyan
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
  },
  '교육비': {
    subCategories: ['학원비', '교재비', '온라인강의'],
    color: '#8b5cf6', // Violet
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
  },
  '가족': {
    subCategories: ['용돈', '모임/행사', '육아'],
    color: '#f59e0b', // Amber
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  'IT/구독': {
    subCategories: ['AI/소프트웨어', '클라우드/웹서비스', '콘텐츠(넷플릭스 등)'],
    color: '#6366f1', // Indigo
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  '문화/여가': {
    subCategories: ['영화/공연', '취미/기기'],
    color: '#14b8a6', // Teal
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
  '여행/휴가': {
    subCategories: ['숙박', '항공/교통', '관광/입장권'],
    color: '#eab308', // Yellow
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
  },
  '건강/의료': {
    subCategories: ['병원/약국', '운동/피트니스'],
    color: '#ef4444', // Red
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
  '금융/기타': {
    subCategories: ['보험', '저축/투자', '경조사/회비', '미분류'],
    color: '#64748b', // Slate
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  '세금': {
    subCategories: ['주민세', '재산세', '자동차세', '종합소득세', '기타 세금'],
    color: '#be123c', // Crimson
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-800',
  },
};

// 기본 수입 2단계 카테고리 (3개 대분류)
export const DEFAULT_INCOME_CATEGORIES: CategoryLookup = {
  '급여': {
    subCategories: ['월급', '상여금/보너스', '수당'],
    color: '#2563eb', // Blue-600
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  '금융/부수입': {
    subCategories: ['이자/배당금', '투자수익', '중고거래'],
    color: '#059669', // Emerald-600
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  '기타 현금': {
    subCategories: ['용돈', '축하금', '기타수입/미분류'],
    color: '#7c3aed', // Purple-600
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
};
