import { Transaction } from '../types/transaction';

/**
 * 오늘 날짜 및 시각 기반 문자열 생성 (예: 20261004_2330)
 */
function getTimestampCompactString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
}

/**
 * DB에 저장된 전체 가계부 내역을 엑셀용 CSV(UTF-8 BOM) 파일로 즉시 다운로드
 */
export function exportAllTransactionsToCsv(transactions: Transaction[]): string {
  if (!transactions || transactions.length === 0) {
    throw new Error('백업할 가계부 내역이 없습니다.');
  }

  // 날짜 및 시간 기준 최신순 정렬
  const sorted = [...transactions].sort((a, b) => {
    const dateA = a.date + (a.time || '');
    const dateB = b.date + (b.time || '');
    return dateB.localeCompare(dateA);
  });

  const headers = [
    '거래유형',
    '날짜',
    '시간',
    '결제수단',
    '대분류',
    '소분류',
    '내용',
    '원금액(원)',
    '청구할인(원)',
    '실결제금액(원)',
    '메모',
  ];

  const rows = sorted.map((tx) => {
    const isIncome = tx.type === 'income';
    const typeLabel = isIncome ? '수입' : '지출';
    const originalAmount = tx.amount || 0;
    const discountAmount = tx.discountAmount || 0;
    const actualAmount = isIncome ? originalAmount : Math.max(0, originalAmount - discountAmount);
    const paymentMethod = tx.paymentMethod || (isIncome ? '계좌입금' : '삼성카드');
    const memo = tx.memo || '';
    const content = tx.content || tx.description || '';

    return [
      typeLabel,
      tx.date,
      tx.time || '',
      `"${paymentMethod.replace(/"/g, '""')}"`,
      `"${tx.mainCategory.replace(/"/g, '""')}"`,
      `"${tx.subCategory.replace(/"/g, '""')}"`,
      `"${content.replace(/"/g, '""')}"`,
      originalAmount,
      discountAmount,
      actualAmount,
      `"${memo.replace(/"/g, '""')}"`,
    ];
  });

  // UTF-8 BOM (\uFEFF) 추가하여 엑셀에서 한글 깨짐 원천 방지
  const csvString =
    '\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const filename = `가계부_전체내역_백업_${getTimestampCompactString()}.csv`;
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
