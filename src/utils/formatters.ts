/**
 * 한국 원화(KRW) 포맷팅
 * @param amount 금액
 * @param showSign + 또는 - 기호 표시 여부
 * @param type 수입/지출 유형
 */
export function formatCurrency(
  amount: number,
  showSign: boolean = false,
  type?: 'income' | 'expense'
): string {
  const formatted = Math.abs(amount).toLocaleString('ko-KR') + '원';
  if (!showSign) return formatted;
  if (type === 'income') return `+ ${formatted}`;
  if (type === 'expense') return `- ${formatted}`;
  return (amount >= 0 ? '+ ' : '- ') + formatted;
}

/**
 * 콤마가 포함된 문자열을 숫자로 변환
 */
export function parseNumberFromString(val: string): number {
  const cleaned = val.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * 날짜 표시 포맷 (예: 2026-09-28 -> 09.28 (월))
 */
export function formatDateWithDay(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[date.getDay()] || '';
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${mm}.${dd} (${dayName})`;
  } catch {
    return dateStr;
  }
}

/**
 * 'YYYY-MM' 형식의 연월을 'YYYY년 M월' 한글 문자열로 변환
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}년 ${parseInt(month, 10)}월`;
}

/**
 * 이전 달 계산 ('YYYY-MM' -> 'YYYY-MM')
 */
export function getPrevMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * 다음 달 계산 ('YYYY-MM' -> 'YYYY-MM')
 */
export function getNextMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * 오늘 날짜 문자열 ('YYYY-MM-DD')
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 오늘 연월 문자열 ('YYYY-MM')
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
