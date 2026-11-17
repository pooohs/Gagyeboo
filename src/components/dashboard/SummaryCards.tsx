import React from 'react';
import { TrendingDown, TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MonthSummary } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardsProps {
  summary: MonthSummary;
  prevSummary?: MonthSummary;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, prevSummary }) => {
  // 전월 대비 지출 증감률 계산
  let expenseDiffPercent: number | null = null;
  if (prevSummary && prevSummary.totalExpense > 0) {
    const diff = summary.totalExpense - prevSummary.totalExpense;
    expenseDiffPercent = Math.round((diff / prevSummary.totalExpense) * 1000) / 10;
  }

  // 잔액 비율 (수입 대비 지출 비중 또는 저축률)
  const savingsRate =
    summary.totalIncome > 0
      ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. 월 총 수입액 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            월 총 수입액
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 tracking-tight">
            {formatCurrency(summary.totalIncome, true, 'income')}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span className="font-medium text-slate-700">{summary.incomeCount}건</span>의 수입 기록
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      </div>

      {/* 2. 월 총 지출액 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            월 총 지출액
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
            {formatCurrency(summary.totalExpense, true, 'expense')}
          </p>
          <div className="mt-2 flex items-center flex-wrap gap-1.5 text-xs">
            <span className="font-medium text-slate-700">{summary.expenseCount}건</span>
            {summary.totalDiscount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                청구할인 -{formatCurrency(summary.totalDiscount)}
              </span>
            )}
            {expenseDiffPercent !== null && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${
                  expenseDiffPercent <= 0
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-rose-700 bg-rose-50'
                }`}
              >
                {expenseDiffPercent <= 0 ? (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                )}
                전월대비 {expenseDiffPercent > 0 ? `+${expenseDiffPercent}%` : `${expenseDiffPercent}%`}
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-400" />
      </div>

      {/* 3. 잔액 (수입 - 지출) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            이번 달 잔액
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              summary.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(summary.balance, true)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {savingsRate !== null ? (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                  savingsRate >= 0
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-200/60'
                    : 'text-rose-700 bg-rose-50 border border-rose-200/60'
                }`}
              >
                {savingsRate >= 0 ? `수입 대비 잉여율 ${savingsRate}%` : `초과 지출 ${Math.abs(savingsRate)}%`}
              </span>
            ) : (
              <span className="text-slate-400">수입 기록 없음</span>
            )}
          </div>
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${
            summary.balance >= 0
              ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              : 'bg-gradient-to-r from-rose-500 to-rose-700'
          }`}
        />
      </div>
    </div>
  );
};
