import React, { useState } from 'react';
import {
  TransactionType,
  CategoryLookup,
  Transaction,
} from '../../types/transaction';
import {
  parsePaymentNotification,
  SAMPLE_SMS_LIST,
  ParsedSmsResult,
} from '../../utils/smsParser';
import { parseNumberFromString, formatCurrency } from '../../utils/formatters';
import { Sparkles, Check, FileText, BadgePercent, CreditCard } from 'lucide-react';
import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  DEFAULT_EXPENSE_PAYMENT_METHOD,
  DEFAULT_INCOME_PAYMENT_METHOD,
} from '../../constants/paymentMethods';

interface TextInputTabProps {
  currentType: TransactionType;
  onChangeType: (type: TransactionType) => void;
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const TextInputTab: React.FC<TextInputTabProps> = ({
  currentType,
  onChangeType,
  expenseCategories,
  incomeCategories,
  onSubmit,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedSmsResult | null>(null);

  // 파싱 후 편집 가능한 필드 상태
  const [editDate, setEditDate] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>(
    currentType === 'income'
      ? DEFAULT_INCOME_PAYMENT_METHOD
      : DEFAULT_EXPENSE_PAYMENT_METHOD
  );
  const [editAmountRaw, setEditAmountRaw] = useState<string>('');
  const [editDiscountRaw, setEditDiscountRaw] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editMainCategory, setEditMainCategory] = useState<string>('');
  const [editSubCategory, setEditSubCategory] = useState<string>('');

  // 텍스트 분석 실행
  const handleParse = (textToParse: string) => {
    if (!textToParse.trim()) {
      setParsed(null);
      return;
    }
    const result = parsePaymentNotification(textToParse);
    setParsed(result);

    // 유형 동기화 (문자 내용에 따라 입금이면 수입으로 자동 변경)
    if (result.type !== currentType) {
      onChangeType(result.type);
    }

    setEditDate(result.date);
    if (result.suggestedPaymentMethod) {
      setEditPaymentMethod(result.suggestedPaymentMethod);
    } else {
      setEditPaymentMethod(
        result.type === 'income'
          ? DEFAULT_INCOME_PAYMENT_METHOD
          : DEFAULT_EXPENSE_PAYMENT_METHOD
      );
    }
    setEditAmountRaw(result.amount > 0 ? result.amount.toLocaleString('ko-KR') : '');

    // 청구할인 키워드 감지 (예: 청구할인 5,000원, 할인 3,000원 등)
    const discountMatch = textToParse.match(/(?:청구할인|할인)[:\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*원?/);
    if (discountMatch && discountMatch[1]) {
      const disc = parseNumberFromString(discountMatch[1]);
      setEditDiscountRaw(disc > 0 ? disc.toLocaleString('ko-KR') : '');
    } else {
      setEditDiscountRaw('');
    }

    setEditDescription(result.description);

    const activeCats =
      result.type === 'income' ? incomeCategories : expenseCategories;
    const main =
      result.suggestedMainCategory && activeCats[result.suggestedMainCategory]
        ? result.suggestedMainCategory
        : Object.keys(activeCats)[0] || '';
    setEditMainCategory(main);

    const subList = activeCats[main]?.subCategories || [];
    const sub =
      result.suggestedSubCategory && subList.includes(result.suggestedSubCategory)
        ? result.suggestedSubCategory
        : subList[0] || '';
    setEditSubCategory(sub);
  };

  const handleApplySample = (sampleText: string) => {
    setRawText(sampleText);
    handleParse(sampleText);
  };

  const handleMainCategoryChange = (newMain: string) => {
    setEditMainCategory(newMain);
    const activeCats =
      currentType === 'income' ? incomeCategories : expenseCategories;
    const subList = activeCats[newMain]?.subCategories || [];
    setEditSubCategory(subList[0] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberFromString(editAmountRaw);
    const discount = parseNumberFromString(editDiscountRaw);

    if (!editDate) {
      alert('날짜를 확인해 주세요.');
      return;
    }
    if (!editDescription.trim()) {
      alert('사용처/내용을 입력해 주세요.');
      return;
    }
    if (amount <= 0) {
      alert('금액을 확인해 주세요.');
      return;
    }

    onSubmit({
      type: currentType,
      date: editDate,
      time: parsed?.time,
      mainCategory: editMainCategory || '기타',
      subCategory: editSubCategory || '미분류',
      content: editDescription.trim(),
      description: editDescription.trim(),
      amount,
      discountAmount: currentType === 'expense' && discount > 0 ? discount : undefined,
      paymentMethod: editPaymentMethod,
      memo: 'SMS/알림톡 자동 파싱 입력',
    });

    // 초기화
    setRawText('');
    setParsed(null);
    setEditDiscountRaw('');
  };

  const activeCategories =
    currentType === 'income' ? incomeCategories : expenseCategories;
  const currentSubList = activeCategories[editMainCategory]?.subCategories || [];

  return (
    <div className="space-y-4">
      {/* 빠른 테스트용 샘플 문자 버튼 */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>샘플 결제/입금 문자 원클릭 테스트:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_SMS_LIST.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySample(sample.text)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition border border-slate-200/70"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* 문자 붙여넣기 텍스트 에어리어 */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            카드사 SMS 또는 카카오톡 알림톡 결제/입금 내역을 붙여넣으세요
          </span>
          {rawText && (
            <button
              type="button"
              onClick={() => {
                setRawText('');
                setParsed(null);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              지우기
            </button>
          )}
        </label>
        <textarea
          rows={3}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            handleParse(e.target.value);
          }}
          placeholder="예시:&#10;[Web발신] KB국민카드 승인 홍*동님 09/28 14:30 스타벅스강남점 12,500원 일시불&#10;[입금] 09/25 4,200,000원 (주)테크솔루션 급여"
          className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono leading-relaxed"
        />
      </div>

      {/* 파싱 결과 및 등록 폼 */}
      {parsed && (
        <form
          onSubmit={handleSubmit}
          className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-indigo-900">
                문자 파싱 완료 (정보를 확인하고 등록하세요)
              </span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                currentType === 'income'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {currentType === 'income' ? '수입 감지' : '지출 감지'}
            </span>
          </div>

          {/* 결제수단 자동 감지 & 확인 칩 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentType === 'income' ? '입금 수단' : '결제 수단'}</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                자동 감지됨
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(currentType === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS).map((m) => {
                const isSelected = editPaymentMethod === m.name;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setEditPaymentMethod(m.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      isSelected
                        ? `${m.activeBg} ${m.activeBorder} ${m.activeText} shadow-sm font-bold scale-[1.02]`
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* 날짜 */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500">날짜</span>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {/* 대분류 */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500">대분류</span>
              <select
                value={editMainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                {Object.keys(activeCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 소분류 */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500">소분류</span>
              <select
                value={editSubCategory}
                onChange={(e) => setEditSubCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
              >
                {currentSubList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* 사용처 / 내용 */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                {currentType === 'income' ? '입금처' : '사용처'}
              </span>
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            {/* 금액 및 청구할인 */}
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500">
                {currentType === 'expense' ? '결제 금액' : '금액'}
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={editAmountRaw}
                  onChange={(e) => {
                    const num = parseNumberFromString(e.target.value);
                    setEditAmountRaw(num > 0 ? num.toLocaleString('ko-KR') : '');
                  }}
                  className="w-full px-2.5 py-1.5 pr-6 text-xs text-right font-bold bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                  원
                </span>
              </div>

              {/* 청구할인 (지출 시 금액 아래 노출) */}
              {currentType === 'expense' && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                      <BadgePercent className="w-2.5 h-2.5" />
                      청구할인
                    </span>
                    {parseNumberFromString(editAmountRaw) > 0 && parseNumberFromString(editDiscountRaw) > 0 && (
                      <span className="text-[9px] font-bold text-indigo-700">
                        실청구: {formatCurrency(Math.max(0, parseNumberFromString(editAmountRaw) - parseNumberFromString(editDiscountRaw)))}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={editDiscountRaw}
                      onChange={(e) => {
                        const num = parseNumberFromString(e.target.value);
                        setEditDiscountRaw(num > 0 ? num.toLocaleString('ko-KR') : '');
                      }}
                      placeholder="0 (선택)"
                      className="w-full px-2 py-1 pr-5 text-[11px] text-right font-semibold bg-emerald-50/50 border border-emerald-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-emerald-600">
                      원
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition active:scale-95 ${
                currentType === 'income'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>가계부에 바로 등록</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
