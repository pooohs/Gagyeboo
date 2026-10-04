export interface PaymentMethodItem {
  id: string;
  name: string;
  shortName: string;
  color: string;
  dotColor: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
  badgeClass: string;
  iconType?: 'card' | 'cash' | 'transfer';
}

/**
 * 지출 시 제공되는 기본 결제수단 목록 (사용자 소유 카드 4종 + 현금 + 계좌이체)
 */
export const EXPENSE_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: 'samsung',
    name: '삼성카드',
    shortName: '삼성',
    color: '#0c4da2',
    dotColor: 'bg-blue-600',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/70',
    iconType: 'card',
  },
  {
    id: 'hana',
    name: '하나카드',
    shortName: '하나',
    color: '#008485',
    dotColor: 'bg-emerald-600',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    iconType: 'card',
  },
  {
    id: 'shinhan',
    name: '신한카드',
    shortName: '신한',
    color: '#0046ff',
    dotColor: 'bg-sky-600',
    activeBorder: 'border-sky-500',
    activeBg: 'bg-sky-50',
    activeText: 'text-sky-700',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/70',
    iconType: 'card',
  },
  {
    id: 'hyundai',
    name: '현대카드',
    shortName: '현대',
    color: '#1e293b',
    dotColor: 'bg-slate-800',
    activeBorder: 'border-slate-800',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-900',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    iconType: 'card',
  },
  {
    id: 'cash',
    name: '현금',
    shortName: '현금',
    color: '#059669',
    dotColor: 'bg-teal-500',
    activeBorder: 'border-teal-500',
    activeBg: 'bg-teal-50',
    activeText: 'text-teal-700',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/70',
    iconType: 'cash',
  },
  {
    id: 'transfer',
    name: '계좌이체',
    shortName: '이체',
    color: '#64748b',
    dotColor: 'bg-slate-500',
    activeBorder: 'border-slate-500',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    iconType: 'transfer',
  },
];

/**
 * 수입 시 제공되는 기본 결제수단 목록
 */
export const INCOME_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: 'account_deposit',
    name: '계좌입금',
    shortName: '계좌',
    color: '#3b82f6',
    dotColor: 'bg-blue-500',
    activeBorder: 'border-blue-500',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/70',
    iconType: 'transfer',
  },
  {
    id: 'cash_income',
    name: '현금',
    shortName: '현금',
    color: '#059669',
    dotColor: 'bg-teal-500',
    activeBorder: 'border-teal-500',
    activeBg: 'bg-teal-50',
    activeText: 'text-teal-700',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/70',
    iconType: 'cash',
  },
  {
    id: 'other_income',
    name: '기타',
    shortName: '기타',
    color: '#64748b',
    dotColor: 'bg-slate-400',
    activeBorder: 'border-slate-400',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    iconType: 'transfer',
  },
];

export const DEFAULT_EXPENSE_PAYMENT_METHOD = '삼성카드';
export const DEFAULT_INCOME_PAYMENT_METHOD = '계좌입금';

/**
 * 결제수단 명칭에 맞는 스타일 설정 반환 함수
 */
export function getPaymentMethodConfig(methodName?: string): PaymentMethodItem {
  if (!methodName) {
    return EXPENSE_PAYMENT_METHODS[0];
  }

  const allMethods = [...EXPENSE_PAYMENT_METHODS, ...INCOME_PAYMENT_METHODS];
  const found = allMethods.find(
    (m) => m.name === methodName || m.shortName === methodName
  );

  if (found) return found;

  // 기타 미분류 결제수단 폴백
  return {
    id: 'custom',
    name: methodName,
    shortName: methodName,
    color: '#64748b',
    dotColor: 'bg-slate-400',
    activeBorder: 'border-slate-400',
    activeBg: 'bg-slate-50',
    activeText: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    iconType: methodName.includes('카드') ? 'card' : 'transfer',
  };
}
