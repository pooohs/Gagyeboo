import React, { useState, useEffect } from 'react';
import {
  Transaction,
  TransactionType,
  CategoryLookup,
} from '../../types/transaction';
import { parseNumberFromString, formatCurrency } from '../../utils/formatters';
import { X, Check, ArrowDownCircle, ArrowUpCircle, BadgePercent, CreditCard } from 'lucide-react';
import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  DEFAULT_EXPENSE_PAYMENT_METHOD,
  DEFAULT_INCOME_PAYMENT_METHOD,
} from '../../constants/paymentMethods';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  onSave: (id: string, updated: Partial<Transaction>) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>(DEFAULT_EXPENSE_PAYMENT_METHOD);
  const [mainCategory, setMainCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [discountRaw, setDiscountRaw] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date);
      setMainCategory(transaction.mainCategory);
      setSubCategory(transaction.subCategory);
      setDescription(transaction.content || transaction.description || '');
      setAmountRaw(transaction.amount.toLocaleString('ko-KR'));
      setDiscountRaw(
        transaction.discountAmount && transaction.discountAmount > 0
          ? transaction.discountAmount.toLocaleString('ko-KR')
          : ''
      );
      setPaymentMethod(
        transaction.paymentMethod ||
          (transaction.type === 'income'
            ? DEFAULT_INCOME_PAYMENT_METHOD
            : DEFAULT_EXPENSE_PAYMENT_METHOD)
      );
      setMemo(transaction.memo || '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const currentCategories =
    type === 'income' ? incomeCategories : expenseCategories;
  const mainList = Object.keys(currentCategories);
  const subList = currentCategories[mainCategory]?.subCategories || [];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCats = newType === 'income' ? incomeCategories : expenseCategories;
    const firstMain = Object.keys(newCats)[0] || '';
    setMainCategory(firstMain);
    const firstSub = newCats[firstMain]?.subCategories[0] || '';
    setSubCategory(firstSub);
    setPaymentMethod(
      newType === 'income'
        ? DEFAULT_INCOME_PAYMENT_METHOD
        : DEFAULT_EXPENSE_PAYMENT_METHOD
    );
  };

  const handleMainChange = (newMain: string) => {
    setMainCategory(newMain);
    const subs = currentCategories[newMain]?.subCategories || [];
    setSubCategory(subs[0] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberFromString(amountRaw);
    const discount = parseNumberFromString(discountRaw);
    if (!description.trim() || amount <= 0) {
      alert('내용과 금액을 올바르게 입력해 주세요.');
      return;
    }

    onSave(transaction.id, {
      type,
      date,
      mainCategory,
      subCategory,
      content: description.trim(),
      description: description.trim(),
      amount,
      discountAmount: type === 'expense' && discount > 0 ? discount : undefined,
      paymentMethod,
      memo: memo.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">
            거래 내역 수정
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 거래 유형 토글 */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              거래 유형
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                지출
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                  type === 'income'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                수입
              </button>
            </div>
          </div>

          {/* 결제수단 선택 칩 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>{type === 'income' ? '입금 수단' : '결제 수단'}</span>
              </label>
              <span className="text-[10px] text-slate-400">원클릭 선택</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(type === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS).map((m) => {
                const isSelected = paymentMethod === m.name;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? `${m.activeBg} ${m.activeBorder} ${m.activeText} shadow-xs font-bold scale-[1.02]`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${m.dotColor}`} />
                    <span>{m.name}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 block">
                  금액 (원)
                </label>
                {type === 'expense' && parseNumberFromString(discountRaw) > 0 && (
                  <span className="text-[10px] text-emerald-600 font-bold">
                    할인 적용
                  </span>
                )}
              </div>
              <input
                type="text"
                value={amountRaw}
                onChange={(e) => {
                  const num = parseNumberFromString(e.target.value);
                  setAmountRaw(num > 0 ? num.toLocaleString('ko-KR') : '');
                }}
                className="w-full px-3 py-2 text-xs font-bold text-right bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* 카드 청구할인 입력 필드 (지출일 때 노출) */}
          {type === 'expense' && (
            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <BadgePercent className="w-3.5 h-3.5 text-emerald-600" />
                  카드 청구할인 금액 (원)
                </label>
                {parseNumberFromString(amountRaw) > 0 && parseNumberFromString(discountRaw) > 0 && (
                  <span className="text-[11px] font-bold text-indigo-700">
                    실 청구: {formatCurrency(Math.max(0, parseNumberFromString(amountRaw) - parseNumberFromString(discountRaw)))}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={discountRaw}
                onChange={(e) => {
                  const num = parseNumberFromString(e.target.value);
                  setDiscountRaw(num > 0 ? num.toLocaleString('ko-KR') : '');
                }}
                placeholder="0"
                className="w-full px-3 py-1.5 text-xs font-bold text-right bg-white border border-emerald-200 text-emerald-700 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                대분류
              </label>
              <select
                value={mainCategory}
                onChange={(e) => handleMainChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                {mainList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                소분류
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
              >
                {subList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              내용 (사용처 / 입금처)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              메모 (선택사항)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* 모달 푸터 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>수정 완료</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
