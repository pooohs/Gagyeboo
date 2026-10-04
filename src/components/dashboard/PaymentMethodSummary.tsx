import React from 'react';
import { PaymentMethodStat } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatters';
import { CreditCard } from 'lucide-react';

interface PaymentMethodSummaryProps {
  stats: PaymentMethodStat[];
  totalExpense: number;
  onSelectMethod?: (methodName: string) => void;
}

export const PaymentMethodSummary: React.FC<PaymentMethodSummaryProps> = ({
  stats,
  totalExpense,
  onSelectMethod,
}) => {
  // 사용 금액이 있는 항목과 기본 카드 4종 + 현금 표시
  const displayStats = stats.filter(
    (s) => s.amount > 0 || ['삼성카드', '신한카드', '현대카드', '하나카드', '현금'].includes(s.name)
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3.5">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              카드별 / 현금별 지출 현황
            </h4>
            <p className="text-xs text-slate-400">
              보유 카드 4종 및 현금 지출 실시간 집계
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">월 지출 합계</span>
          <p className="text-sm font-extrabold text-slate-800">
            {formatCurrency(totalExpense, false)}
          </p>
        </div>
      </div>

      {/* 카드별 그리드 리스트 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {displayStats.map((item) => {
          const hasSpending = item.amount > 0;
          return (
            <div
              key={item.name}
              onClick={() => onSelectMethod && onSelectMethod(item.name)}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                hasSpending
                  ? `${item.bgColor} ${item.borderColor} shadow-xs hover:shadow-md cursor-pointer hover:scale-[1.02]`
                  : 'bg-slate-50/60 border-slate-200/60 text-slate-400'
              }`}
              title={hasSpending ? `${item.name} 내역 모아보기` : undefined}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span
                      className={`text-xs font-bold truncate ${
                        hasSpending ? item.textColor : 'text-slate-500'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      hasSpending
                        ? 'bg-white/80 text-slate-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {item.count}건
                  </span>
                </div>

                <div className="mt-2">
                  <div
                    className={`text-sm sm:text-base font-extrabold tracking-tight ${
                      hasSpending ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(item.amount, false)}
                  </div>
                </div>
              </div>

              {/* 지출 비중 프로그레스 바 */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>비중</span>
                  <span className="font-semibold text-slate-600">
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(item.percentage, hasSpending ? 4 : 0))}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
