import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CategoryStat, TransactionType } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatters';

interface DonutChartProps {
  type: TransactionType;
  stats: CategoryStat[];
  totalAmount: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ type, stats, totalAmount }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (stats.length === 0 || totalAmount === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-medium">
          {type === 'income' ? '이번 달 수입 내역이 없습니다.' : '이번 달 지출 내역이 없습니다.'}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          아래 입력창에서 내역을 추가해 보세요.
        </p>
      </div>
    );
  }

  const activeItem = activeIndex !== null ? stats[activeIndex] : null;

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={stats}
            dataKey="amount"
            nameKey="mainCategory"
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={96}
            paddingAngle={3}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {stats.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="transition-all duration-200 cursor-pointer outline-none"
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, false), '금액']}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            }}
            itemStyle={{ color: '#f8fafc' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 도넛 차트 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        {activeItem ? (
          <>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full mb-0.5 text-white"
              style={{ backgroundColor: activeItem.color }}
            >
              {activeItem.mainCategory}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {formatCurrency(activeItem.amount, false)}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {activeItem.percentage}% ({activeItem.count}건)
            </span>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-slate-500">
              {type === 'income' ? '총 수입' : '총 지출'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalAmount, false)}
            </span>
            <span className="text-[10px] text-slate-400">
              {stats.length}개 카테고리
            </span>
          </>
        )}
      </div>
    </div>
  );
};
