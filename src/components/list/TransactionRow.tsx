import React from 'react';
import { Transaction, CategoryLookup } from '../../types/transaction';
import { formatCurrency, formatDateWithDay } from '../../utils/formatters';
import { Edit2, Trash2, Image as ImageIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getPaymentMethodConfig } from '../../constants/paymentMethods';

interface TransactionRowProps {
  transaction: Transaction;
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onViewImage?: (imageUrl: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  expenseCategories,
  incomeCategories,
  onEdit,
  onDelete,
  onViewImage,
}) => {
  const isIncome = transaction.type === 'income';
  const categories = isIncome ? incomeCategories : expenseCategories;
  const categoryInfo = categories[transaction.mainCategory];
  const catColor = categoryInfo?.color || '#94a3b8';
  const paymentMethodName =
    transaction.paymentMethod || (isIncome ? '계좌입금' : '삼성카드');
  const methodConfig = getPaymentMethodConfig(paymentMethodName);

  return (
    <tr className="hover:bg-slate-50/80 transition-colors group text-xs sm:text-sm border-b border-slate-100 last:border-b-0">
      {/* 1. 거래 유형 */}
      <td className="py-3 px-3 sm:px-4">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
            isIncome
              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
          }`}
        >
          {isIncome ? (
            <ArrowUpRight className="w-3 h-3 text-blue-600" />
          ) : (
            <ArrowDownRight className="w-3 h-3 text-rose-600" />
          )}
          {isIncome ? '수입' : '지출'}
        </span>
      </td>

      {/* 2. 날짜 및 시간 */}
      <td className="py-3 px-3 sm:px-4 text-slate-700 font-medium whitespace-nowrap">
        <div className="flex flex-col">
          <span>{formatDateWithDay(transaction.date)}</span>
          {transaction.time && (
            <span className="text-[10px] text-slate-400">{transaction.time}</span>
          )}
        </div>
      </td>

      {/* 3. 결제수단 */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold border ${methodConfig.badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${methodConfig.dotColor}`} />
          <span>{paymentMethodName}</span>
        </span>
      </td>

      {/* 4. 대분류 */}
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: `${catColor}15`,
            color: catColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: catColor }}
          />
          {transaction.mainCategory}
        </span>
      </td>

      {/* 4. 소분류 */}
      <td className="py-3 px-3 sm:px-4 text-slate-600 whitespace-nowrap">
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
          {transaction.subCategory}
        </span>
      </td>

      {/* 5. 내용(사용처/입금처) & 메모 */}
      <td className="py-3 px-3 sm:px-4 text-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-medium">{transaction.content || transaction.description}</span>
          {transaction.receiptImage && (
            <button
              onClick={() => onViewImage && onViewImage(transaction.receiptImage!)}
              className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded"
              title="영수증 사진 보기"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {transaction.memo && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            {transaction.memo}
          </p>
        )}
      </td>

      {/* 6. 금액 (수입: 파란색 + , 지출: 빨간색 -) */}
      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap font-bold">
        {!isIncome && transaction.discountAmount && transaction.discountAmount > 0 ? (
          <div className="flex flex-col items-end">
            <span className="text-sm sm:text-base tracking-tight text-rose-600">
              {formatCurrency(transaction.amount - transaction.discountAmount, true, 'expense')}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="line-through">{formatCurrency(transaction.amount)}</span>
              <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                청구할인 -{formatCurrency(transaction.discountAmount)}
              </span>
            </div>
          </div>
        ) : (
          <span
            className={`text-sm sm:text-base tracking-tight ${
              isIncome ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(transaction.amount, true, transaction.type)}
          </span>
        )}
      </td>

      {/* 7. 관리 (수정/삭제) */}
      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="수정"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const itemTitle = transaction.content || transaction.description;
              if (confirm(`'${itemTitle}' 항목을 삭제하시겠습니까?`)) {
                onDelete(transaction.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
