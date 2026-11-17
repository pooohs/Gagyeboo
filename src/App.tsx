import React, { useState, useCallback } from 'react';
import { useCategories } from './hooks/useCategories';
import { useTransactions } from './hooks/useTransactions';
import { Header } from './components/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { TransactionInput } from './components/input/TransactionInput';
import { TransactionList } from './components/list/TransactionList';
import { SafetyBackupCard } from './components/common/SafetyBackupCard';
import { CategoryModal } from './components/modals/CategoryModal';
import { EditTransactionModal } from './components/modals/EditTransactionModal';
import { ReceiptViewModal } from './components/modals/ReceiptViewModal';
import { ToastContainer } from './components/common/Toast';
import { Transaction, ToastMessage } from './types/transaction';
import { exportToJsonFile, importFromJsonFile } from './utils/fileStorage';
import { exportAllTransactionsToCsv } from './utils/csvExport';
import { getCurrentYearMonth } from './utils/formatters';

export const App: React.FC = () => {
  // 1. 카테고리 룩업 테이블 상태
  const {
    expenseCategories,
    incomeCategories,
    addSubCategory,
    deleteSubCategory,
    resetToDefaults,
  } = useCategories();

  // 2. 가계부 거래 내역 상태 (오늘 기준 현재 월 자동 선택 및 Cloudflare D1 실시간 연동)
  const {
    transactions,
    monthTransactions,
    selectedMonth,
    setSelectedMonth,
    monthSummary,
    prevMonthSummary,
    isSyncing,
    syncError,
    lastSyncedAt,
    syncWithCloud,
    getCategoryStats,
    getPaymentMethodStats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    resetTransactions,
  } = useTransactions(getCurrentYearMonth());

  const paymentMethodStats = React.useMemo(() => {
    return getPaymentMethodStats();
  }, [getPaymentMethodStats]);

  // 3. UI 및 모달 제어 상태
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // 4. 토스트 알림 상태
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 거래 등록 핸들러
  const handleAddTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx = addTransaction(data);
    const itemTitle = newTx.content || newTx.description || '새 항목';
    addToast(
      `${data.type === 'income' ? '수입' : '지출'} 내역이 등록되었습니다. (${itemTitle})`,
      'success'
    );
  };

  // 거래 수정 핸들러
  const handleUpdateTransaction = (id: string, updated: Partial<Transaction>) => {
    updateTransaction(id, updated);
    addToast('거래 내역이 수정되었습니다.', 'info');
  };

  // 거래 삭제 핸들러
  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    addToast('거래 내역이 삭제되었습니다.', 'error');
  };

  // JSON 파일로 백업(다운로드)
  const handleBackupJson = () => {
    try {
      const filename = exportToJsonFile(transactions);
      addToast(`가계부 데이터가 파일로 다운로드되었습니다. (${filename})`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '백업 파일 생성 중 오류가 발생했습니다.';
      addToast(msg, 'error');
    }
  };

  // 전체 내역 CSV(엑셀 호환 UTF-8 BOM) 파일로 즉시 백업(다운로드)
  const handleBackupAllCsv = () => {
    try {
      const filename = exportAllTransactionsToCsv(transactions);
      addToast(`엑셀용 전체 내역(CSV) 파일이 다운로드되었습니다. (${filename})`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'CSV 백업 중 오류가 발생했습니다.';
      addToast(msg, 'error');
    }
  };

  // JSON 파일 불러오기(업로드)
  const handleImportJson = async (file: File) => {
    try {
      const imported = await importFromJsonFile(file);
      importTransactions(imported);
      setSelectedCategoryFilter(null);
      addToast(
        `${imported.length}건의 거래 내역을 파일(${file.name})에서 성공적으로 불러왔습니다.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '파일 불러오기 중 오류가 발생했습니다.';
      addToast(msg, 'error');
    }
  };

  // 데이터 초기화
  const handleResetData = () => {
    if (confirm('모든 가계부 데이터를 초기화하시겠습니까? (필요한 경우 먼저 [데이터 백업하기]로 저장해 두세요)')) {
      resetTransactions();
      setSelectedCategoryFilter(null);
      addToast('데이터가 초기화되었습니다.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. 상단 네비게이션 헤더 */}
      <Header
        currentMonth={selectedMonth}
        onMonthChange={(newMonth) => {
          setSelectedMonth(newMonth);
          setSelectedCategoryFilter(null);
        }}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onResetData={handleResetData}
        onBackupJson={handleBackupJson}
        onImportJson={handleImportJson}
        onBackupAllCsv={handleBackupAllCsv}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onSyncNow={() => syncWithCloud(false)}
      />

      {/* 2. 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 상단: 대시보드 (3개 KPI 카드, 도넛 차트, 카테고리 요약표) */}
        <section aria-label="월별 지출 대시보드">
          <Dashboard
            summary={monthSummary}
            prevSummary={prevMonthSummary}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            getCategoryStats={getCategoryStats}
            paymentMethodStats={paymentMethodStats}
            selectedCategory={selectedCategoryFilter}
            onSelectCategory={setSelectedCategoryFilter}
          />
        </section>

        {/* 중단: 지출/수입 입력 모듈 (3가지 탭) */}
        <section aria-label="지출 및 수입 입력">
          <TransactionInput
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            onAddTransaction={handleAddTransaction}
          />
        </section>

        {/* 하단: 지출/수입 내역 리스트 (엑셀 형태의 스프레드시트 그리드) */}
        <section aria-label="지출 내역 리스트">
          <TransactionList
            transactions={monthTransactions}
            currentMonth={selectedMonth}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            selectedCategoryFilter={selectedCategoryFilter}
            onCategoryFilterChange={setSelectedCategoryFilter}
            onEdit={(tx) => setEditingTransaction(tx)}
            onDelete={handleDeleteTransaction}
            onViewImage={(url) => setPreviewImageUrl(url)}
          />
        </section>

        {/* 안심 데이터 보존 & Cloudflare D1 실시간 클라우드 동기화 안내 및 엑셀 백업 카드 */}
        <section aria-label="안심 데이터 백업 및 클라우드 동기화">
          <SafetyBackupCard
            totalCount={transactions.length}
            isSyncing={isSyncing}
            syncError={syncError}
            lastSyncedAt={lastSyncedAt}
            onSyncNow={() => syncWithCloud(false)}
            onBackupCsv={handleBackupAllCsv}
            onBackupJson={handleBackupJson}
          />
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <p>스마트 가계부 (Account Book Web App) • React + Tailwind CSS + Recharts</p>
      </footer>

      {/* 3. 모달 레이어 */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onAddSubCategory={addSubCategory}
        onDeleteSubCategory={deleteSubCategory}
        transactions={transactions}
        onResetToDefaults={resetToDefaults}
      />

      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        onSave={handleUpdateTransaction}
      />

      <ReceiptViewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* 토스트 피드백 */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default App;
