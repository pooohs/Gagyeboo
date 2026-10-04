import React, { useState, useRef } from 'react';
import {
  TransactionType,
  CategoryLookup,
  Transaction,
} from '../../types/transaction';
import { getTodayDateString, parseNumberFromString, formatCurrency } from '../../utils/formatters';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  PlusCircle,
  Loader2,
  BadgePercent,
  CreditCard,
  Check,
} from 'lucide-react';
import {
  EXPENSE_PAYMENT_METHODS,
  INCOME_PAYMENT_METHODS,
  DEFAULT_EXPENSE_PAYMENT_METHOD,
  DEFAULT_INCOME_PAYMENT_METHOD,
} from '../../constants/paymentMethods';

interface ReceiptPhotoTabProps {
  transactionType: TransactionType;
  categories: CategoryLookup;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const ReceiptPhotoTab: React.FC<ReceiptPhotoTabProps> = ({
  transactionType,
  categories,
  onSubmit,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [ocrDetected, setOcrDetected] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 폼 입력 상태
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

  const mainCategoryList = Object.keys(categories);

  // transactionType 변경 시 결제수단 기본값 동기화
  React.useEffect(() => {
    setPaymentMethod(
      transactionType === 'income'
        ? DEFAULT_INCOME_PAYMENT_METHOD
        : DEFAULT_EXPENSE_PAYMENT_METHOD
    );
  }, [transactionType]);

  // 기본 카테고리 세팅
  React.useEffect(() => {
    if (mainCategoryList.length > 0 && !mainCategory) {
      const firstMain = mainCategoryList[0];
      setMainCategory(firstMain);
      const subList = categories[firstMain]?.subCategories || [];
      setSubCategory(subList[0] || '');
    }
  }, [categories, mainCategoryList, mainCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      // 모의 OCR 자동 실행 유도
      simulateOcrScan(file.name);
    };
    reader.readAsDataURL(file);
  };

  // 모의 OCR 인식 시뮬레이션
  const simulateOcrScan = (_name: string) => {
    setIsAnalyzing(true);
    setOcrDetected(false);

    setTimeout(() => {
      setIsAnalyzing(false);
      setOcrDetected(true);

      // 모의 영수증 결과 자동 채우기
      setDate(getTodayDateString());
      setDescription('영수증 결제 (마트/식재료)');
      setAmountRaw('45,800');

      if (categories['식비']) {
        setMainCategory('식비');
        setSubCategory('식재료(마트)');
      }
    }, 1200);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFileName('');
    setOcrDetected(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberFromString(amountRaw);
    const discount = parseNumberFromString(discountRaw);
    if (!description.trim() || amount <= 0) {
      alert('내용과 금액을 올바르게 입력해 주세요.');
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
      receiptImage: imagePreview || undefined,
      memo: fileName ? `영수증 첨부 (${fileName})` : undefined,
    });

    handleRemoveImage();
    setDescription('');
    setAmountRaw('');
    setDiscountRaw('');
  };

  const currentSubList = categories[mainCategory]?.subCategories || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 좌측: 영수증 업로드 & 미리보기 영역 (5/12) */}
        <div className="md:col-span-5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition group h-60"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                영수증 사진 업로드
              </p>
              <p className="text-xs text-slate-400 mt-1">
                클릭하여 파일을 선택하거나 드래그앤드롭하세요 (JPG, PNG)
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span>사진 선택</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group h-60 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="영수증 미리보기"
                className="w-full h-full object-contain"
              />

              {/* 오버레이 액션 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg shadow hover:bg-slate-100 transition"
                >
                  사진 변경
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 bg-rose-600 text-white rounded-lg shadow hover:bg-rose-700 transition"
                  title="사진 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 하단 파일명 배지 */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur text-white text-[11px] px-2.5 py-1 rounded-lg truncate flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                <span className="truncate">{fileName}</span>
              </div>
            </div>
          )}
        </div>

        {/* 우측: 인식 상태 및 등록 폼 (7/12) */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            {/* OCR 인식 상태 바 */}
            <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 영수증 분석을 시뮬레이션 중입니다...</span>
                </div>
              ) : ocrDetected ? (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>영수증 텍스트 인식 완료! 아래 정보를 확인해 주세요.</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>영수증을 첨부하면 금액 및 사용처가 자동 추출됩니다.</span>
                  <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                    OCR 준비 완료
                  </span>
                </div>
              )}
            </div>

            {/* 입력 필드들 */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 결제수단 원클릭 칩 선택 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-indigo-500" />
                    <span>{transactionType === 'income' ? '입금 수단' : '결제 수단'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">원클릭 선택</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(transactionType === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS).map((m) => {
                    const isSelected = paymentMethod === m.name;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.name)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-all ${
                          isSelected
                            ? `${m.activeBg} ${m.activeBorder} ${m.activeText} font-bold shadow-xs scale-[1.02]`
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dotColor}`} />
                        <span>{m.name}</span>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">
                    날짜
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-600">
                      금액 (원)
                    </label>
                    {transactionType === 'expense' && parseNumberFromString(discountRaw) > 0 && (
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
                    placeholder="0"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold text-right bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                    required
                  />

                  {/* 카드 청구할인 입력칸 */}
                  {transactionType === 'expense' && (
                    <div className="mt-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                          <BadgePercent className="w-2.5 h-2.5 text-emerald-600" />
                          청구할인 (원)
                        </label>
                        {parseNumberFromString(amountRaw) > 0 && parseNumberFromString(discountRaw) > 0 && (
                          <span className="text-[10px] font-bold text-indigo-700">
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
                        className="w-full mt-1 px-2 py-1 text-xs font-semibold text-right bg-emerald-50/50 border border-emerald-200 text-emerald-700 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">
                    대분류
                  </label>
                  <select
                    value={mainCategory}
                    onChange={(e) => {
                      setMainCategory(e.target.value);
                      const subList = categories[e.target.value]?.subCategories || [];
                      setSubCategory(subList[0] || '');
                    }}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {mainCategoryList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">
                    소분류
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {currentSubList.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  내용 (사용처)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="예: 이마트 역삼점 장보기"
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition active:scale-95 ${
                    transactionType === 'income'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>
                    {transactionType === 'income'
                      ? '영수증 수입 등록'
                      : '영수증 지출 등록'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
