export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string; // 고유 식별자(예: Date.now())
  date: string; // YYYY-MM-DD
  type: TransactionType; // income 또는 expense
  mainCategory: string; // 대분류
  subCategory: string; // 소분류
  content: string; // 사용처 및 내용
  amount: number; // 숫자형태의 결제 금액
  discountAmount?: number; // 카드 청구할인 금액
  paymentMethod?: string; // 결제수단 (삼성카드, 하나카드, 신한카드, 현대카드, 현금, 계좌이체 등)
  description?: string; // 호환성 유지용
  time?: string;
  receiptImage?: string;
  memo?: string;
  createdAt?: string;
}

export interface CategoryLookup {
  [mainCategory: string]: {
    subCategories: string[];
    color: string;
    bgColor?: string;
    textColor?: string;
  };
}

export interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  totalDiscount: number; // 총 청구할인 금액
}

export interface CategoryStat {
  mainCategory: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface PaymentMethodStat {
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export type ListFilterType = 'all' | 'expense' | 'income';
export type SortField = 'date' | 'amount';
export type SortOrder = 'desc' | 'asc';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}
