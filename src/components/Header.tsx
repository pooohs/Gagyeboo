import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  RotateCcw,
  WalletCards,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import { formatYearMonth, getNextMonth, getPrevMonth, getCurrentYearMonth } from '../utils/formatters';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (newMonth: string) => void;
  onOpenCategoryModal: () => void;
  onResetData: () => void;
  onBackupJson: () => void;
  onImportJson: (file: File) => void;
  onBackupAllCsv?: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: Date | null;
  onSyncNow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  onMonthChange,
  onOpenCategoryModal,
  onResetData,
  onBackupJson,
  onImportJson,
  onBackupAllCsv,
  isSyncing = false,
  lastSyncedAt = null,
  onSyncNow,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentActualYearMonth = getCurrentYearMonth();
  const isThisMonth = currentMonth === currentActualYearMonth;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      // 같은 파일 재선택 가능하도록 리셋
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrev = () => {
    onMonthChange(getPrevMonth(currentMonth));
  };

  const handleNext = () => {
    onMonthChange(getNextMonth(currentMonth));
  };

  const handleGoToday = () => {
    onMonthChange(currentActualYearMonth);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 앱 타이틀 & 로고 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <WalletCards className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                스마트 가계부
              </h1>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              수입·지출 통합 자산 관리 시스템
            </p>
          </div>
        </div>

        {/* 월(Month) 이동 컨트롤러 */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-sm active:scale-95"
            title="이전 달"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800 tracking-wide select-none min-w-[96px] text-center">
              {formatYearMonth(currentMonth)}
            </span>
          </div>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-sm active:scale-95"
            title="다음 달"
            aria-label="다음 달"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isThisMonth && (
            <button
              onClick={handleGoToday}
              className="ml-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
            >
              이번 달
            </button>
          )}
        </div>

        {/* 숨김 파일 인풋 */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 우측 도구: 실시간 동기화 뱃지, CSV 엑셀 백업, JSON 백업, 불러오기, 카테고리 설정, 초기화 */}
        <div className="flex items-center gap-2">
          {/* 실시간 클라우드 동기화 상태 버튼 */}
          {onSyncNow && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition shadow-2xs active:scale-95 disabled:opacity-60"
              title="Cloudflare D1 실시간 동기화 상태 (클릭 시 최신 데이터 새로고침)"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden md:inline">
                {isSyncing
                  ? '동기화 중...'
                  : lastSyncedAt
                  ? `${String(lastSyncedAt.getHours()).padStart(2, '0')}:${String(
                      lastSyncedAt.getMinutes()
                    ).padStart(2, '0')} 동기화됨`
                  : '실시간 연결'}
              </span>
            </button>
          )}

          {/* CSV 엑셀 백업 버튼 */}
          {onBackupAllCsv && (
            <button
              onClick={onBackupAllCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs active:scale-95"
              title="전체 가계부 내역을 엑셀(CSV) 파일로 내 PC에 즉시 다운로드"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">CSV 엑셀 백업</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}

          {/* 데이터 백업하기 (JSON 다운로드) */}
          <button
            onClick={onBackupJson}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition shadow-2xs active:scale-95"
            title="현재 가계부 데이터를 JSON 파일로 다운로드"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">JSON 백업</span>
          </button>

          {/* 데이터 불러오기 (JSON 업로드) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition shadow-2xs active:scale-95"
            title="PC에 저장된 JSON 가계부 파일 불러오기"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="hidden lg:inline">불러오기</span>
          </button>

          {/* 카테고리 설정 */}
          <button
            onClick={onOpenCategoryModal}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-2xs active:scale-95"
            title="2단계 카테고리 관리"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden xl:inline">카테고리 설정</span>
          </button>

          <button
            onClick={onResetData}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition active:scale-95"
            title="데이터 초기화"
            aria-label="데이터 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
