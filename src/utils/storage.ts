import { CategoryLookup, Transaction } from '../types/transaction';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/defaultCategories';
import { INITIAL_MOCK_TRANSACTIONS } from '../constants/mockData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'house_account_transactions_v1',
  EXPENSE_CATEGORIES: 'house_account_expense_categories_v1',
  INCOME_CATEGORIES: 'house_account_income_categories_v1',
};

export function loadTransactionsFromStorage(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      // 초기 기본 목 데이터 저장 후 반환
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_MOCK_TRANSACTIONS));
      return INITIAL_MOCK_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_MOCK_TRANSACTIONS;
    
    // 9월 가짜(Mock) 데이터 제거 (tx-inc-, tx-exp- 로 시작하는 2026-09 내역)
    const cleaned = parsed.filter((tx) => {
      const isSept2026 = tx.date && tx.date.startsWith('2026-09');
      const isMockItem =
        typeof tx.id === 'string' &&
        (tx.id.startsWith('tx-inc-') || tx.id.startsWith('tx-exp-'));
      return !(isSept2026 && isMockItem);
    });

    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e);
    return INITIAL_MOCK_TRANSACTIONS;
  }
}

export function saveTransactionsToStorage(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function loadCategoriesFromStorage(): {
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
} {
  let expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
  let incomeCategories = DEFAULT_INCOME_CATEGORIES;

  try {
    const rawExp = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
    if (rawExp) {
      const parsed = JSON.parse(rawExp);
      expenseCategories = { ...DEFAULT_EXPENSE_CATEGORIES, ...parsed };
      for (const [key, val] of Object.entries(DEFAULT_EXPENSE_CATEGORIES)) {
        if (!expenseCategories[key]) {
          expenseCategories[key] = val;
        }
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
    }

    const rawInc = localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES);
    if (rawInc) {
      const parsed = JSON.parse(rawInc);
      incomeCategories = { ...DEFAULT_INCOME_CATEGORIES, ...parsed };
      for (const [key, val] of Object.entries(DEFAULT_INCOME_CATEGORIES)) {
        if (!incomeCategories[key]) {
          incomeCategories[key] = val;
        }
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    }
  } catch (e) {
    console.error('Failed to load categories from localStorage', e);
  }

  return { expenseCategories, incomeCategories };
}

export function saveCategoriesToStorage(
  expenseCategories: CategoryLookup,
  incomeCategories: CategoryLookup
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(expenseCategories));
    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(incomeCategories));
  } catch (e) {
    console.error('Failed to save categories to localStorage', e);
  }
}

export function resetAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.INCOME_CATEGORIES);
  } catch (e) {
    console.error('Failed to reset storage', e);
  }
}
