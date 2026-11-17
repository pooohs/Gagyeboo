import React, { useState } from 'react';
import { CategoryLookup, Transaction, TransactionType } from '../../types/transaction';
import { X, Plus, RotateCcw, Tag, Layers, AlertTriangle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: CategoryLookup;
  incomeCategories: CategoryLookup;
  onAddSubCategory: (
    type: TransactionType,
    mainCategory: string,
    newSubCategory: string
  ) => boolean;
  onDeleteSubCategory: (
    type: TransactionType,
    mainCategory: string,
    subCategory: string
  ) => void;
  transactions: Transaction[];
  onResetToDefaults: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onAddSubCategory,
  onDeleteSubCategory,
  transactions,
  onResetToDefaults,
}) => {
  const [activeType, setActiveType] = useState<TransactionType>('expense');
  const [selectedMain, setSelectedMain] = useState<string>('');
  const [newSubInput, setNewSubInput] = useState<string>('');
  // 삭제 확인 대기 중인 소분류
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // 대분류/유형이 바뀌면 삭제 확인 창은 닫는다
  React.useEffect(() => {
    setPendingDelete(null);
  }, [activeType, selectedMain, isOpen]);

  const currentCategories =
    activeType === 'income' ? incomeCategories : expenseCategories;
  const mainKeys = Object.keys(currentCategories);

  // 기본 메인 카테고리 설정
  React.useEffect(() => {
    if (mainKeys.length > 0 && (!selectedMain || !currentCategories[selectedMain])) {
      setSelectedMain(mainKeys[0]);
    }
  }, [activeType, currentCategories, mainKeys, selectedMain]);

  if (!isOpen) return null;

  const currentCategoryData = currentCategories[selectedMain];

  // 해당 소분류로 분류된 거래 건수
  const countUsage = (sub: string) =>
    transactions.filter(
      (t) =>
        t.type === activeType &&
        t.mainCategory === selectedMain &&
        t.subCategory === sub
    ).length;

  const pendingUsage = pendingDelete ? countUsage(pendingDelete) : 0;

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    onDeleteSubCategory(activeType, selectedMain, pendingDelete);
    setPendingDelete(null);
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubInput.trim()) return;

    const success = onAddSubCategory(activeType, selectedMain, newSubInput.trim());
    if (success) {
      setNewSubInput('');
    } else {
      alert('이미 존재하거나 추가할 수 없는 소분류입니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                2단계 카테고리 관리 (Lookup Table)
              </h3>
              <p className="text-xs text-slate-400">
                대분류와 소분류 구조를 확인하고 소분류를 추가하거나 삭제할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 유형 선택 [ 지출 카테고리 | 수입 카테고리 ] */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveType('expense')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeType === 'expense'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              지출 카테고리 (12개 대분류)
            </button>
            <button
              onClick={() => setActiveType('income')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeType === 'income'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              수입 카테고리 (3개 대분류)
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('모든 카테고리를 기본 초기 상태로 복원하시겠습니까?')) {
                onResetToDefaults();
              }
            }}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>
        </div>

        {/* 2-컬럼 레이아웃: 좌측 대분류 리스트, 우측 소분류 목록 & 추가 */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[300px]">
          {/* 좌측: 대분류 목록 (5/12) */}
          <div className="md:col-span-5 border-r border-slate-100 p-3 overflow-y-auto space-y-1 bg-slate-50/50">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider block mb-1">
              1단계 대분류 선택
            </span>
            {mainKeys.map((mainKey) => {
              const item = currentCategories[mainKey];
              const isSelected = selectedMain === mainKey;
              return (
                <button
                  key={mainKey}
                  onClick={() => setSelectedMain(mainKey)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{mainKey}</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-normal">
                    {item.subCategories.length}개
                  </span>
                </button>
              );
            })}
          </div>

          {/* 우측: 소분류 목록 및 신규 추가 (7/12) */}
          <div className="md:col-span-7 p-5 overflow-y-auto flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-800">
                  [{selectedMain}] 하위 소분류
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentCategoryData?.color }}
                />
              </div>

              {/* 현재 소분류 뱃지 리스트 */}
              <div className="flex flex-wrap gap-2 pt-3">
                {currentCategoryData?.subCategories.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(sub)}
                      aria-label={`${sub} 삭제`}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* 삭제 확인 */}
              {pendingDelete && (
                <div
                  role="alertdialog"
                  className="mt-4 p-3 rounded-xl border border-rose-200 bg-rose-50"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-rose-800 space-y-1">
                      <p className="font-bold">
                        '{pendingDelete}' 소분류를 삭제할까요?
                      </p>
                      {pendingUsage > 0 ? (
                        <p>
                          이 소분류로 분류된 거래가{' '}
                          <b>{pendingUsage}건</b> 있습니다. 그래도 삭제하시겠습니까?
                          거래 내역은 그대로 남지만 카테고리 목록에서는 사라집니다.
                        </p>
                      ) : (
                        <p>이 소분류로 분류된 거래는 없습니다.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setPendingDelete(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 신규 소분류 추가 입력 폼 */}
            <form onSubmit={handleAddSub} className="pt-4 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                '{selectedMain}'에 새 소분류 추가
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubInput}
                  onChange={(e) => setNewSubInput(e.target.value)}
                  placeholder="예: 배달음식, 헬스장"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
