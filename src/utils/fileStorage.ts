import { Transaction } from '../types/transaction';

/**
 * 오늘 날짜를 기반으로 YYYYMMDD 문자열 생성 (예: 20261002)
 */
export function getTodayDateCompactString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 모든 수입/지출 데이터를 account_book_YYYYMMDD.json 파일로 다운로드(Export)
 */
export function exportToJsonFile(transactions: Transaction[]): string {
  // 요구사항 명세에 맞춘 깔끔한 JSON 데이터 객체 배열로 정제
  const dataToExport = transactions.map((tx) => ({
    id: String(tx.id || Date.now()),
    date: tx.date,
    type: tx.type === 'income' ? 'income' : 'expense',
    mainCategory: tx.mainCategory || '미분류',
    subCategory: tx.subCategory || '기타',
    content: tx.content || tx.description || '내용 없음',
    amount: Number(tx.amount) || 0,
    discountAmount: Number(tx.discountAmount) || 0,
    paymentMethod: tx.paymentMethod || (tx.type === 'income' ? '계좌입금' : '삼성카드'),
  }));

  const jsonString = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const filename = `account_book_${getTodayDateCompactString()}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * 사용자 PC에서 선택한 JSON 파일을 읽고 파싱하여 Transaction[] 으로 반환(Import)
 */
export function importFromJsonFile(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('선택된 파일이 없습니다.'));
      return;
    }

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      reject(new Error('JSON 파일(.json)만 불러올 수 있습니다.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed)) {
          throw new Error('올바른 가계부 데이터 형식(JSON 배열)이 아닙니다.');
        }

        // 각 항목 유효성 검사 및 정규화
        const validatedTransactions: Transaction[] = parsed.map((item, index) => {
          if (typeof item !== 'object' || item === null) {
            throw new Error(`${index + 1}번째 항목의 데이터 형식이 올바르지 않습니다.`);
          }

          const id = item.id ? String(item.id) : `imported-${Date.now()}-${index}`;
          const date = typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
            ? item.date
            : new Date().toISOString().slice(0, 10);
          const type = item.type === 'income' ? 'income' : 'expense';
          const mainCategory = typeof item.mainCategory === 'string' ? item.mainCategory : '미분류';
          const subCategory = typeof item.subCategory === 'string' ? item.subCategory : '기타';
          const content = typeof item.content === 'string'
            ? item.content
            : (typeof item.description === 'string' ? item.description : '내용 없음');
          const amount = typeof item.amount === 'number'
            ? Math.abs(item.amount)
            : parseInt(String(item.amount).replace(/[^0-9]/g, ''), 10) || 0;
          const discountAmount = typeof item.discountAmount === 'number'
            ? Math.abs(item.discountAmount)
            : parseInt(String(item.discountAmount || 0).replace(/[^0-9]/g, ''), 10) || 0;
          const paymentMethod = typeof item.paymentMethod === 'string' && item.paymentMethod.trim()
            ? item.paymentMethod.trim()
            : (type === 'income' ? '계좌입금' : '삼성카드');

          return {
            id,
            date,
            type,
            mainCategory,
            subCategory,
            content,
            description: content, // 호환용
            amount,
            discountAmount: discountAmount > 0 ? discountAmount : undefined,
            paymentMethod,
          };
        });

        resolve(validatedTransactions);
      } catch (err: unknown) {
        if (err instanceof Error) {
          reject(new Error(`JSON 파싱 실패: ${err.message}`));
        } else {
          reject(new Error('JSON 파일을 읽는 중 알 수 없는 오류가 발생했습니다.'));
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는 도중 오류가 발생했습니다.'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}
