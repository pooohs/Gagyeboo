import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  TransactionType,
  MonthSummary,
  CategoryStat,
  PaymentMethodStat,
} from '../types/transaction';
import {
  loadTransactionsFromStorage,
  saveTransactionsToStorage,
} from '../utils/storage';
import { getPrevMonth, getCurrentYearMonth } from '../utils/formatters';
import { getPaymentMethodConfig } from '../constants/paymentMethods';
import {
  fetchTransactionsApi,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  bulkImportTransactionsApi,
} from '../services/api';

export function useTransactions(initialMonth: string = getCurrentYearMonth()) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return loadTransactionsFromStorage();
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

  // 클라우드 동기화 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // transactions 변경 시 로컬스토리지에도 백업 캐시 유지
  useEffect(() => {
    saveTransactionsToStorage(transactions);
  }, [transactions]);

  // 클라우드 D1 서버와 데이터 동기화
  const syncWithCloud = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setIsSyncing(true);
    setSyncError(null);
    try {
      const remoteTransactions = await fetchTransactionsApi();
      if (Array.isArray(remoteTransactions)) {
        // 서버 DB가 비어있고 로컬에 기존 거래가 있는 경우, 로컬 데이터를 서버로 마이그레이션
        const localData = loadTransactionsFromStorage();
        if (remoteTransactions.length === 0 && localData.length > 0) {
          try {
            await bulkImportTransactionsApi(localData);
          } catch (migrateErr) {
            console.warn('초기 로컬 데이터 마이그레이션 실패:', migrateErr);
          }
          setTransactions(localData);
        } else {
          setTransactions(remoteTransactions);
          saveTransactionsToStorage(remoteTransactions);
        }
        setLastSyncedAt(new Date());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '클라우드 동기화 실패';
      console.warn('클라우드 동기화 실패 (오프라인 모드 유지):', msg);
      setSyncError(msg);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // 멀티 디바이스 실시간 동기화 (마운트 시, 창 포커스 시, 주기적 30초 폴링)
  useEffect(() => {
    syncWithCloud(true);

    const handleFocus = () => {
      syncWithCloud(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithCloud(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 사용자가 켜놓은 동안 30초 주기로 변경 내역 자동 동기화
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncWithCloud(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [syncWithCloud]);

  // 선택된 월의 거래 내역
  const monthTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 선택된 월의 요약 통계 (총 수입, 총 지출, 잔액, 총 청구할인)
  const monthSummary = useMemo<MonthSummary>(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let totalDiscount = 0;

    for (const tx of monthTransactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        const discount = tx.discountAmount || 0;
        totalDiscount += discount;
        totalExpense += tx.amount - discount;
        expenseCount++;
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      totalDiscount,
    };
  }, [monthTransactions]);

  // 전월 요약 통계 (전월 대비 비교용)
  const prevMonth = useMemo(() => getPrevMonth(selectedMonth), [selectedMonth]);
  const prevMonthSummary = useMemo<MonthSummary>(() => {
    const prevTxs = transactions.filter((tx) => tx.date.startsWith(prevMonth));
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let totalDiscount = 0;

    for (const tx of prevTxs) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
      } else {
        const discount = tx.discountAmount || 0;
        totalDiscount += discount;
        totalExpense += tx.amount - discount;
        expenseCount++;
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      totalDiscount,
    };
  }, [transactions, prevMonth]);

  // 카테고리별 통계 계산 함수 (대분류 기준, 수입 또는 지출)
  const getCategoryStats = useCallback(
    (type: TransactionType, colorLookup: Record<string, string>): CategoryStat[] => {
      const filtered = monthTransactions.filter((tx) => tx.type === type);
      const total = type === 'income' ? monthSummary.totalIncome : monthSummary.totalExpense;

      const groupMap = new Map<string, { amount: number; count: number }>();

      for (const tx of filtered) {
        const netAmount = tx.type === 'expense' ? tx.amount - (tx.discountAmount || 0) : tx.amount;
        const current = groupMap.get(tx.mainCategory) || { amount: 0, count: 0 };
        groupMap.set(tx.mainCategory, {
          amount: current.amount + netAmount,
          count: current.count + 1,
        });
      }

      const stats: CategoryStat[] = [];
      for (const [mainCategory, data] of groupMap.entries()) {
        const percentage = total > 0 ? (data.amount / total) * 100 : 0;
        stats.push({
          mainCategory,
          amount: data.amount,
          count: data.count,
          percentage: Math.round(percentage * 10) / 10,
          color: colorLookup[mainCategory] || '#94a3b8',
        });
      }

      // 지출액 높은 순 정렬
      return stats.sort((a, b) => b.amount - a.amount);
    },
    [monthTransactions, monthSummary]
  );

  // 결제수단별(카드별/현금별) 지출 통계 계산
  const getPaymentMethodStats = useCallback((): PaymentMethodStat[] => {
    const expenseTxs = monthTransactions.filter((tx) => tx.type === 'expense');
    const totalExpense = monthSummary.totalExpense;

    // 사용자 기본 카드 4종 + 현금 + 계좌이체
    const predefinedOrder = ['삼성카드', '하나카드', '신한카드', '현대카드', '현금', '계좌이체'];
    const map = new Map<string, { amount: number; count: number }>();

    for (const tx of expenseTxs) {
      const method = tx.paymentMethod || '삼성카드';
      const netAmount = tx.amount - (tx.discountAmount || 0);
      const current = map.get(method) || { amount: 0, count: 0 };
      map.set(method, {
        amount: current.amount + netAmount,
        count: current.count + 1,
      });
    }

    const allMethods = Array.from(new Set([...predefinedOrder, ...Array.from(map.keys())]));

    const stats: PaymentMethodStat[] = allMethods.map((methodName) => {
      const data = map.get(methodName) || { amount: 0, count: 0 };
      const cfg = getPaymentMethodConfig(methodName);
      const percentage = totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0;
      return {
        name: methodName,
        amount: data.amount,
        count: data.count,
        percentage: Math.round(percentage * 10) / 10,
        color: cfg.color,
        bgColor: cfg.activeBg,
        borderColor: cfg.activeBorder,
        textColor: cfg.activeText,
      };
    });

    return stats;
  }, [monthTransactions, monthSummary.totalExpense]);

  // 거래 내역 추가 (낙관적 UI 반영 + Cloudflare D1 API 호출)
  const addTransaction = useCallback(
    (data: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
      const content = data.content || data.description || '';
      const localId = String(Date.now());
      const newTx: Transaction = {
        ...data,
        id: localId,
        content,
        description: content,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);
      setSelectedMonth(getCurrentYearMonth());

      // 클라우드 D1 비동기 등록
      createTransactionApi(newTx)
        .then((savedTx) => {
          setTransactions((prev) =>
            prev.map((item) => (item.id === localId ? savedTx : item))
          );
          setLastSyncedAt(new Date());
        })
        .catch((err) => {
          console.warn('클라우드 저장 실패 (로컬 캐시 유지):', err);
        });

      return newTx;
    },
    []
  );

  // 거래 내역 수정 (낙관적 UI 반영 + Cloudflare D1 API 호출)
  const updateTransaction = useCallback(
    (id: string, updated: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.id !== id) return tx;
          const content = updated.content || updated.description || tx.content || tx.description || '';
          return {
            ...tx,
            ...updated,
            content,
            description: content,
          };
        })
      );

      // 클라우드 D1 비동기 수정
      updateTransactionApi(id, updated)
        .then(() => {
          setLastSyncedAt(new Date());
        })
        .catch((err) => {
          console.warn('클라우드 수정 실패 (로컬 캐시 유지):', err);
        });
    },
    []
  );

  // 외부 JSON 파일로부터 거래 내역 일괄 불러오기 (Import) + D1 일괄 업로드
  const importTransactions = useCallback(async (imported: Transaction[]) => {
    setTransactions(imported);
    saveTransactionsToStorage(imported);
    setSelectedMonth(getCurrentYearMonth());

    try {
      setIsSyncing(true);
      await bulkImportTransactionsApi(imported);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('클라우드 일괄 업로드 실패 (로컬 저장 유지):', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 기존 내역은 유지하고 새 거래만 추가 (CSV 불러오기용). 로컬 저장은 effect가 처리
  const mergeTransactions = useCallback(async (added: Transaction[]) => {
    if (added.length === 0) return;
    setTransactions((prev) => [...added, ...prev]);
    setSelectedMonth(getCurrentYearMonth());

    try {
      setIsSyncing(true);
      await bulkImportTransactionsApi(added);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('클라우드 일괄 업로드 실패 (로컬 저장 유지):', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 거래 내역 단건 삭제
  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    deleteTransactionApi(id)
      .then(() => {
        setLastSyncedAt(new Date());
      })
      .catch((err) => {
        console.warn('클라우드 삭제 실패 (로컬 캐시 유지):', err);
      });
  }, []);

  // 거래 내역 다건 일괄 삭제
  const deleteMultipleTransactions = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setTransactions((prev) => prev.filter((tx) => !idSet.has(tx.id)));

    Promise.all(ids.map((id) => deleteTransactionApi(id)))
      .then(() => {
        setLastSyncedAt(new Date());
      })
      .catch((err) => {
        console.warn('클라우드 일괄 삭제 실패:', err);
      });
  }, []);

  // 전체 데이터 초기화
  const resetTransactions = useCallback(() => {
    setTransactions([]);
    saveTransactionsToStorage([]);
    setSelectedMonth(getCurrentYearMonth());
  }, []);

  return {
    transactions,
    monthTransactions,
    selectedMonth,
    setSelectedMonth,
    monthSummary,
    prevMonthSummary,
    isLoading,
    isSyncing,
    syncError,
    lastSyncedAt,
    syncWithCloud,
    getCategoryStats,
    getPaymentMethodStats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    importTransactions,
    mergeTransactions,
    resetTransactions,
  };
}
