import React, { useState, useMemo } from 'react';
import {
  Transaction,
  CategoryLookup,
  ListFilterType,
  SortField,
  SortOrder,
} from '../../types/transaction';
import { TransactionRow } from './TransactionRow';
import { formatYearMonth } from '../../utils/formatters';
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  Table as TableIcon,
  X,
  CreditCard,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  currentMonth: string;
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  selectedCategoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onViewImage?: (imageUrl: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currentMonth,
  expenseCategories,
  incomeCategories,
  selectedCategoryFilter,
  onCategoryFilterChange,
  onEdit,
  onDelete,
  onViewImage,
}) => {
  const [filterType, setFilterType] = useState<ListFilterType>('all');
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] =
    useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 사용 가능한 대분류 목록 수집
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => cats.add(tx.mainCategory));
    return Array.from(cats);
  }, [transactions]);

  // 필터링 및 검색 적용
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. 유형 필터 (전체 / 지출만 / 수입만)
      if (filterType === 'expense' && tx.type !== 'expense') return false;
      if (filterType === 'income' && tx.type !== 'income') return false;

      // 2. 카테고리 필터
      if (selectedCategoryFilter && tx.mainCategory !== selectedCategoryFilter) {
        return false;
      }

      // 3. 결제수단 필터
      if (selectedPaymentMethodFilter) {
        const txMethod =
          tx.paymentMethod || (tx.type === 'income' ? '계좌입금' : '삼성카드');
        if (txMethod !== selectedPaymentMethodFilter) return false;
      }

      // 4. 검색어 필터 (내용, 카테고리, 메모, 결제수단)
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase();
        const itemContent = (tx.content || tx.description || '').toLowerCase();
        const matchesContent = itemContent.includes(query);
        const matchesMain = tx.mainCategory.toLowerCase().includes(query);
        const matchesSub = tx.subCategory.toLowerCase().includes(query);
        const matchesMemo = tx.memo?.toLowerCase().includes(query);
        const matchesMethod = (tx.paymentMethod || '').toLowerCase().includes(query);
        if (!matchesContent && !matchesMain && !matchesSub && !matchesMemo && !matchesMethod) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterType, selectedCategoryFilter, selectedPaymentMethodFilter, searchKeyword]);

  // 정렬 적용
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = a.date + (a.time || '');
        const dateB = b.date + (b.time || '');
        return sortOrder === 'desc'
          ? dateB.localeCompare(dateA)
          : dateA.localeCompare(dateB);
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // 필터링된 결과의 합계 계산
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let discount = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        const d = tx.discountAmount || 0;
        expense += tx.amount - d;
        discount += d;
      }
    }
    return { income, expense, discount, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // CSV 엑셀 내보내기 (한글 깨짐 방지 UTF-8 BOM 추가)
  const handleExportCSV = () => {
    if (sortedTransactions.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = [
      '거래유형',
      '날짜',
      '시간',
      '결제수단',
      '대분류',
      '소분류',
      '내용',
      '원금액(원)',
      '청구할인(원)',
      '실결제금액(원)',
      '메모',
    ];
    const rows = sortedTransactions.map((tx) => [
      tx.type === 'income' ? '수입' : '지출',
      tx.date,
      tx.time || '',
      `"${tx.paymentMethod || (tx.type === 'income' ? '계좌입금' : '삼성카드')}"`,
      `"${tx.mainCategory}"`,
      `"${tx.subCategory}"`,
      `"${(tx.content || tx.description || '').replace(/"/g, '""')}"`,
      tx.amount,
      tx.discountAmount || 0,
      tx.type === 'expense' ? tx.amount - (tx.discountAmount || 0) : tx.amount,
      `"${(tx.memo || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `가계부_${currentMonth}_내역_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* 1. 상단 툴바: 제목, 통계 요약, 필터 탭, 검색 및 엑셀 다운로드 */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {formatYearMonth(currentMonth)} 가계부 상세 내역
              </h3>
              <p className="text-xs text-slate-400">
                엑셀 형태의 스프레드시트 그리드 (실시간 검색 및 수정 지원)
              </p>
            </div>
          </div>

          {/* 엑셀 CSV 다운로드 버튼 */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-sm self-start md:self-auto active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel(CSV) 다운로드</span>
          </button>
        </div>

        {/* 필터 및 검색 컨트롤 */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          {/* 좌측: [ 전체 | 지출만 | 수입만 ] 필터 버튼 그룹 */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'expense'
                  ? 'bg-white text-rose-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              지출만
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'income'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              수입만
            </button>
          </div>

          {/* 우측: 카테고리 필터 + 키워드 검색창 */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* 카테고리 선택 드롭다운 */}
            <div className="relative min-w-[130px] flex-1 sm:flex-initial">
              <select
                value={selectedCategoryFilter || ''}
                onChange={(e) =>
                  onCategoryFilterChange(e.target.value ? e.target.value : null)
                }
                className="w-full pl-7 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-slate-700 font-medium"
              >
                <option value="">모든 카테고리</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {selectedCategoryFilter && (
                <button
                  onClick={() => onCategoryFilterChange(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="필터 해제"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 결제수단 필터 드롭다운 */}
            <div className="relative min-w-[130px] flex-1 sm:flex-initial">
              <select
                value={selectedPaymentMethodFilter || ''}
                onChange={(e) =>
                  setSelectedPaymentMethodFilter(e.target.value ? e.target.value : null)
                }
                className="w-full pl-7 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none text-slate-700 font-medium"
              >
                <option value="">모든 결제수단</option>
                <option value="삼성카드">삼성카드</option>
                <option value="하나카드">하나카드</option>
                <option value="신한카드">신한카드</option>
                <option value="현대카드">현대카드</option>
                <option value="현금">현금</option>
                <option value="계좌이체">계좌이체</option>
                <option value="계좌입금">계좌입금</option>
              </select>
              <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {selectedPaymentMethodFilter && (
                <button
                  onClick={() => setSelectedPaymentMethodFilter(null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="결제수단 필터 해제"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 검색창 */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="사용처, 내용, 결제수단 검색..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 필터링 합계 바 */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 bg-slate-50/70 px-3 py-2 rounded-xl border border-slate-200/50">
          <span>
            조회 결과: <strong className="text-slate-800">{filteredTotals.count}건</strong>
            {selectedCategoryFilter && ` (카테고리: ${selectedCategoryFilter})`}
            {selectedPaymentMethodFilter && ` (결제수단: ${selectedPaymentMethodFilter})`}
          </span>
          <div className="flex items-center gap-3">
            {filteredTotals.income > 0 && (
              <span className="font-semibold text-blue-600">
                수입: +{filteredTotals.income.toLocaleString()}원
              </span>
            )}
            {filteredTotals.expense > 0 && (
              <span className="font-semibold text-rose-600">
                지출: -{filteredTotals.expense.toLocaleString()}원
              </span>
            )}
            {filteredTotals.discount > 0 && (
              <span className="font-semibold text-emerald-600">
                (청구할인 -{filteredTotals.discount.toLocaleString()}원)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. 엑셀 형태 그리드 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <th className="py-2.5 px-3 sm:px-4 w-20">유형</th>
              <th
                onClick={() => toggleSort('date')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:bg-slate-200/60 transition-colors w-32"
              >
                <div className="flex items-center gap-1">
                  <span>날짜</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  {sortField === 'date' && (
                    <span className="text-indigo-600 font-bold">
                      {sortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3 sm:px-4 w-28">결제수단</th>
              <th className="py-2.5 px-3 sm:px-4 w-28">대분류</th>
              <th className="py-2.5 px-3 sm:px-4 w-28">소분류</th>
              <th className="py-2.5 px-3 sm:px-4">내용 (사용처/입금처)</th>
              <th
                onClick={() => toggleSort('amount')}
                className="py-2.5 px-3 sm:px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors w-36"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>금액</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  {sortField === 'amount' && (
                    <span className="text-indigo-600 font-bold">
                      {sortOrder === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </div>
              </th>
              <th className="py-2.5 px-3 sm:px-4 text-right w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  expenseCategories={expenseCategories}
                  incomeCategories={incomeCategories}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewImage={onViewImage}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-400 text-sm"
                >
                  <p className="font-medium">조건에 맞는 거래 내역이 없습니다.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    상단 입력창에서 새 내역을 등록하거나 검색/필터를 초기화해 보세요.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
