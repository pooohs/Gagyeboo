import React from 'react';
import { CategoryStat } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatters';

interface SummaryTableProps {
  stats: CategoryStat[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  stats,
  selectedCategory,
  onSelectCategory,
}) => {
  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3">카테고리</th>
              <th className="py-2.5 px-3 text-right">금액</th>
              <th className="py-2.5 px-3 text-right">비중</th>
              <th className="py-2.5 px-3 w-28 hidden sm:table-cell">비율 바</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.map((stat) => {
              const isSelected = selectedCategory === stat.mainCategory;
              return (
                <tr
                  key={stat.mainCategory}
                  onClick={() =>
                    onSelectCategory(isSelected ? null : stat.mainCategory)
                  }
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 font-medium'
                      : 'hover:bg-slate-50/80'
                  }`}
                  title="클릭 시 하단 내역 리스트 필터링"
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="text-slate-800 font-medium">
                        {stat.mainCategory}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({stat.count}건)
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                    {formatCurrency(stat.amount, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                    {stat.percentage}%
                  </td>
                  <td className="py-2.5 px-3 hidden sm:table-cell">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(stat.percentage, 100)}%`,
                          backgroundColor: stat.color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedCategory && (
        <div className="p-2 bg-indigo-50/60 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-700 px-3">
          <span>
            현재 <strong>'{selectedCategory}'</strong> 필터링 적용 중
          </span>
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-semibold underline hover:text-indigo-900"
          >
            필터 해제
          </button>
        </div>
      )}
    </div>
  );
};
