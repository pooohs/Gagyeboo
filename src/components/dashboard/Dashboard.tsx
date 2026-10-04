import React, { useState } from 'react';
import {
  MonthSummary,
  CategoryStat,
  PaymentMethodStat,
  TransactionType,
  CategoryLookup,
} from '../../types/transaction';
import { SummaryCards } from './SummaryCards';
import { DonutChart } from './DonutChart';
import { SummaryTable } from './SummaryTable';
import { PaymentMethodSummary } from './PaymentMethodSummary';
import { PieChart as PieIcon, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface DashboardProps {
  summary: MonthSummary;
  prevSummary?: MonthSummary;
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  getCategoryStats: (
    type: TransactionType,
    colorLookup: Record<string, string>
  ) => CategoryStat[];
  paymentMethodStats?: PaymentMethodStat[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  prevSummary,
  expenseCategories,
  incomeCategories,
  getCategoryStats,
  paymentMethodStats,
  selectedCategory,
  onSelectCategory,
}) => {
  // 차트 분석 대상: 'expense' (지출 분석) 또는 'income' (수입 분석)
  const [chartType, setChartType] = useState<TransactionType>('expense');

  // 카테고리 색상 맵 생성
  const activeColorLookup = React.useMemo(() => {
    const lookup: Record<string, string> = {};
    const categories =
      chartType === 'income' ? incomeCategories : expenseCategories;
    for (const [key, value] of Object.entries(categories)) {
      lookup[key] = value.color;
    }
    return lookup;
  }, [chartType, expenseCategories, incomeCategories]);

  const stats = React.useMemo(() => {
    return getCategoryStats(chartType, activeColorLookup);
  }, [chartType, getCategoryStats, activeColorLookup]);

  const currentTotal =
    chartType === 'income' ? summary.totalIncome : summary.totalExpense;

  return (
    <div className="space-y-5">
      {/* 3대 핵심 KPI 카드 (총 수입, 총 지출, 잔액) */}
      <SummaryCards summary={summary} prevSummary={prevSummary} />

      {/* 카드별 / 현금별 지출 현황 요약 */}
      {paymentMethodStats && paymentMethodStats.length > 0 && (
        <PaymentMethodSummary
          stats={paymentMethodStats}
          totalExpense={summary.totalExpense}
        />
      )}

      {/* 카테고리별 비중 차트 및 요약 테이블 영역 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <PieIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              월별 카테고리 분석
            </h2>
            <span className="text-xs text-slate-400">
              (대분류 기준 비중 및 누적액)
            </span>
          </div>

          {/* 지출 vs 수입 차트 전환 토글 */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => {
                setChartType('expense');
                onSelectCategory(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'expense'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>지출 비중</span>
            </button>
            <button
              onClick={() => {
                setChartType('income');
                onSelectCategory(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'income'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>수입 비중</span>
            </button>
          </div>
        </div>

        {/* 차트 & 요약 표 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          {/* 좌측: 도넛 차트 (5/12) */}
          <div className="lg:col-span-5">
            <DonutChart
              type={chartType}
              stats={stats}
              totalAmount={currentTotal}
            />
          </div>

          {/* 우측: 요약 표 (7/12) */}
          <div className="lg:col-span-7">
            <SummaryTable
              stats={stats}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
