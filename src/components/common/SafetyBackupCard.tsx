import React from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Database,
  Cloud,
  Download,
  AlertCircle,
} from 'lucide-react';

interface SafetyBackupCardProps {
  totalCount: number;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: Date | null;
  onSyncNow: () => void;
  onBackupCsv: () => void;
  onBackupJson: () => void;
}

export const SafetyBackupCard: React.FC<SafetyBackupCardProps> = ({
  totalCount,
  isSyncing,
  syncError,
  lastSyncedAt,
  onSyncNow,
  onBackupCsv,
  onBackupJson,
}) => {
  const formatSyncTime = (date: Date | null) => {
    if (!date) return '동기화 대기 중';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `오늘 ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* 설명 및 상태 헤더 */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                안심 데이터 보존 & 실시간 클라우드 동기화
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                Cloudflare D1 실시간 연동
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Mac과 스마트폰 어디서 작성하든 <strong>Cloudflare D1 SQL DB</strong>에 즉시 영구 저장되고 실시간 동기화됩니다.
              소중한 가계부 데이터를 언제든 한 번의 클릭으로 엑셀(CSV)과 JSON 파일로 내 PC에 안전하게 백업하세요.
            </p>

            {/* 상태 뱃지 줄 */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                총 저장 내역: <strong className="text-slate-900">{totalCount.toLocaleString()}건</strong>
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`}
                />
                동기화 상태: {isSyncing ? '동기화 중...' : formatSyncTime(lastSyncedAt)}
              </span>

              {syncError && (
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  오프라인 모드 (로컬 캐시 보존됨)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-end lg:self-center shrink-0">
          {/* 수동 동기화 버튼 */}
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs active:scale-95 transition disabled:opacity-50"
            title="클라우드 최신 내역 즉시 새로고침"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '동기화 중...' : '지금 동기화'}</span>
          </button>

          {/* JSON 백업 */}
          <button
            onClick={onBackupJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 shadow-xs active:scale-95 transition"
            title="전체 데이터를 JSON 파일로 다운로드"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>JSON 백업</span>
          </button>

          {/* CSV 엑셀 백업 (강조 버튼) */}
          <button
            onClick={onBackupCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 active:scale-95 transition"
            title="엑셀(Excel)에서 바로 열리는 UTF-8 BOM CSV 파일로 전체 내역 다운로드"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV로 엑셀 백업하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
