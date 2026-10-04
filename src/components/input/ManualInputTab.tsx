import React, { useState, useEffect } from 'react';
import {
  TransactionType,
  CategoryLookup,
  Transaction,
} from '../../types/transaction';
import { getTodayDateString, parseNumberFromString, formatCurrency } from '../../utils/formatters';
import { PlusCircle, Calendar, Tag, Layers, AlignLeft, DollarSign, BadgePercent, CreditCard, Check } from 'lucide-react';
import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  DEFAULT_EXPENSE_PAYMENT_METHOD,
  DEFAULT_INCOME_PAYMENT_METHOD,
} from '../../constants/paymentMethods';

interface ManualInputTabProps {
  transactionType: TransactionType;
  categories: CategoryLookup;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const ManualInputTab: React.FC<ManualInputTabProps> = ({
  transactionType,
  categories,
  onSubmit,
}) => {
  const [date, setDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<string>(
    transactionType === 'income'
      ? DEFAULT_INCOME_PAYMENT_METHOD
      : DEFAULT_EXPENSE_PAYMENT_METHOD
  );
  const [mainCategory, setMainCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amountRaw, setAmountRaw] = useState<string>('');
  const [discountRaw, setDiscountRaw] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  const mainCategoryList = Object.keys(categories);

  // transactionType 변경 시 결제수단 기본값 동기화
  useEffect(() => {
    setPaymentMethod(
      transactionType === 'income'
        ? DEFAULT_INCOME_PAYMENT_METHOD
        : DEFAULT_EXPENSE_PAYMENT_METHOD
    );
  }, [transactionType]);

  // 카테고리 목록이나 transactionType 변경 시 첫 번째 카테고리로 기본 선택
  useEffect(() => {
    if (mainCategoryList.length > 0) {
      const firstMain = mainCategoryList[0];
      setMainCategory(firstMain);
      const subList = categories[firstMain]?.subCategories || [];
      setSubCategory(subList[0] || '');
    } else {
      setMainCategory('');
      setSubCategory('');
    }
  }, [transactionType, categories]);

  // 대분류 변경 핸들러
  const handleMainCategoryChange = (newMain: string) => {
    setMainCategory(newMain);
    const subList = categories[newMain]?.subCategories || [];
    setSubCategory(subList[0] || '');
  };

  // 금액 입력 핸들러 (숫자만, 콤마 자동 서식)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseNumberFromString(e.target.value);
    setAmountRaw(num > 0 ? num.toLocaleString('ko-KR') : '');
  };

  // 청구할인 금액 입력 핸들러
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseNumberFromString(e.target.value);
    setDiscountRaw(num > 0 ? num.toLocaleString('ko-KR') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberFromString(amountRaw);
    const discount = parseNumberFromString(discountRaw);

    if (!date) {
      alert('날짜를 선택해 주세요.');
      return;
    }
    if (!description.trim()) {
      alert('내용(사용처/입금처)을 입력해 주세요.');
      return;
    }
    if (amount <= 0) {
      alert('금액을 올바르게 입력해 주세요.');
      return;
    }

    onSubmit({
      type: transactionType,
      date,
      mainCategory: mainCategory || '미분류',
      subCategory: subCategory || '기타',
      content: description.trim(),
      description: description.trim(),
      amount,
      discountAmount: transactionType === 'expense' && discount > 0 ? discount : undefined,
      paymentMethod,
      memo: memo.trim() || undefined,
    });

    // 폼 초기화
    setDescription('');
    setAmountRaw('');
    setDiscountRaw('');
    setMemo('');
  };

  const currentSubList = categories[mainCategory]?.subCategories || [];
  const activePaymentMethods =
    transactionType === 'income'
      ? INCOME_PAYMENT_METHODS
      : EXPENSE_PAYMENT_METHODS;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 결제수단 원클릭 칩 선택 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/70">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
          <span>{transactionType === 'income' ? '입금 수단' : '결제 수단'}</span>
          <span className="text-[11px] font-normal text-slate-400">(원클릭 선택)</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {activePaymentMethods.map((m) => {
            const isSelected = paymentMethod === m.name;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? `${m.activeBg} ${m.activeBorder} ${m.activeText} shadow-sm font-bold scale-[1.02]`
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. 날짜 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            required
          />
        </div>

        {/* 2. 대분류 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            대분류 ({transactionType === 'income' ? '수입' : '지출'})
          </label>
          <select
            value={mainCategory}
            onChange={(e) => handleMainCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          >
            {mainCategoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 3. 소분류 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            소분류
          </label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          >
            {currentSubList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* 4. 내용 (사용처/입금처) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
            {transactionType === 'income' ? '입금처 / 내용' : '사용처 / 내용'}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              transactionType === 'income'
                ? '예: 9월 정기 급여'
                : '예: 스타벅스 강남점'
            }
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            required
          />
        </div>

        {/* 5. 금액 및 청구할인 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              {transactionType === 'expense' ? '결제 금액 (원)' : '금액 (원)'}
            </label>
            {transactionType === 'expense' && parseNumberFromString(discountRaw) > 0 && (
              <span className="text-[10px] text-emerald-600 font-bold">
                할인 적용 중
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={amountRaw}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full px-3 py-2 pr-7 text-sm font-semibold text-right bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              required
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
              원
            </span>
          </div>

          {/* 카드 청구할인 입력칸 (지출일 때 금액 바로 아래 노출) */}
          {transactionType === 'expense' && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <BadgePercent className="w-3 h-3 text-emerald-600" />
                  청구할인 (원)
                </label>
                {parseNumberFromString(amountRaw) > 0 && parseNumberFromString(discountRaw) > 0 && (
                  <span className="text-[10px] font-bold text-indigo-700">
                    실 청구: {formatCurrency(Math.max(0, parseNumberFromString(amountRaw) - parseNumberFromString(discountRaw)))}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={discountRaw}
                  onChange={handleDiscountChange}
                  placeholder="0 (선택사항)"
                  className="w-full px-3 py-1.5 pr-7 text-xs font-semibold text-right bg-emerald-50/40 border border-emerald-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder:text-slate-400"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-emerald-600 pointer-events-none">
                  원
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 메모 및 등록 버튼 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="w-full sm:w-2/3">
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="추가 메모 또는 결제수단 (선택사항)"
            className="w-full px-3 py-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none transition"
          />
        </div>

        <button
          type="submit"
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
            transactionType === 'income'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>
            {transactionType === 'income' ? '수입 등록' : '지출 등록'}
          </span>
        </button>
      </div>
    </form>
  );
};
