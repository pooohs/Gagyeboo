import React, { useState } from 'react';
import {
  TransactionType,
  CategoryLookup,
  Transaction,
} from '../../types/transaction';
import { ManualInputTab } from './ManualInputTab';
import { TextInputTab } from './TextInputTab';
import { ReceiptPhotoTab } from './ReceiptPhotoTab';
import {
  Edit3,
  MessageSquareText,
  Camera,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface TransactionInputProps {
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  onAddTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

type TabType = 'manual' | 'text' | 'receipt';

export const TransactionInput: React.FC<TransactionInputProps> = ({
  expenseCategories,
  incomeCategories,
  onAddTransaction,
}) => {
  // 거래 유형: 'expense' (지출) vs 'income' (수입)
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  // 입력 탭: 'manual' (직접 입력), 'text' (텍스트/SMS 파싱), 'receipt' (사진 업로드)
  const [activeTab, setActiveTab] = useState<TabType>('manual');

  const currentCategories =
    transactionType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* 1. 상단 바: [지출 | 수입] 유형 토글 및 입력 방식 탭 */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        {/* 거래 유형 토글 [ 지출 | 수입 ] */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            거래 유형:
          </span>
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setTransactionType('expense')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                transactionType === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>지출 입력</span>
            </button>

            <button
              type="button"
              onClick={() => setTransactionType('income')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                transactionType === 'income'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>수입 입력</span>
            </button>
          </div>
        </div>

        {/* 3가지 입력 방식 탭 ('직접 입력', '텍스트 입력', '사진 업로드') */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>직접 입력</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>텍스트 입력 (SMS 파싱)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'receipt'
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>영수증 사진</span>
          </button>
        </div>
      </div>

      {/* 2. 활성화된 탭 컨텐츠 */}
      <div className="p-4 sm:p-5">
        {activeTab === 'manual' && (
          <ManualInputTab
            transactionType={transactionType}
            categories={currentCategories}
            onSubmit={onAddTransaction}
          />
        )}

        {activeTab === 'text' && (
          <TextInputTab
            currentType={transactionType}
            onChangeType={setTransactionType}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            onSubmit={onAddTransaction}
          />
        )}

        {activeTab === 'receipt' && (
          <ReceiptPhotoTab
            transactionType={transactionType}
            categories={currentCategories}
            onSubmit={onAddTransaction}
          />
        )}
      </div>
    </div>
  );
};
