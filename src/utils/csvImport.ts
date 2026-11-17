import { Transaction } from '../types/transaction';

/**
 * CSV 텍스트를 2차원 배열로 파싱 (따옴표, "" 이스케이프, 따옴표 안의 쉼표/줄바꿈, CRLF 지원)
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // 완전히 빈 줄 제거
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** 거래 한 건의 내용 기반 키 (중복 판별 및 고정 ID 생성용) */
export function transactionDedupeKey(t: {
  type: string;
  date: string;
  time?: string;
  paymentMethod?: string;
  mainCategory: string;
  subCategory: string;
  content: string;
  amount: number;
  discountAmount?: number;
  memo?: string;
}): string {
  return [
    t.type,
    t.date,
    t.time || '',
    t.paymentMethod || (t.type === 'income' ? '계좌입금' : '삼성카드'),
    t.mainCategory,
    t.subCategory,
    t.content,
    t.amount,
    t.discountAmount || 0,
    t.memo || '',
  ].join('|');
}

/** 짧은 문자열 해시 (FNV-1a, base36) */
function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 엑셀에서 다시 저장된 날짜(2026/11/5, 2026.11.05 등)도 YYYY-MM-DD로 정규화 */
function normalizeDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${m[1]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeTime(raw: string): string | undefined {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0;
  const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

export interface CsvImportResult {
  transactions: Transaction[];
  /** 읽지 못한 줄 (줄 번호는 헤더 포함 파일 기준) */
  errors: { line: number; reason: string }[];
}

/** 파일 바이트를 문자열로 디코딩: UTF-8 우선, 깨지면 EUC-KR(엑셀 기본 CSV) 재시도 */
async function readFileText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8').decode(buf);
  if (!utf8.includes('�')) return utf8;
  try {
    return new TextDecoder('euc-kr').decode(buf);
  } catch {
    return utf8;
  }
}

const HEADER_ALIASES: Record<string, string[]> = {
  type: ['거래유형', '유형', '구분'],
  date: ['날짜', '일자'],
  time: ['시간'],
  paymentMethod: ['결제수단'],
  mainCategory: ['대분류'],
  subCategory: ['소분류'],
  content: ['내용', '사용처'],
  amount: ['원금액(원)', '원금액', '금액'],
  discountAmount: ['청구할인(원)', '청구할인', '할인'],
  memo: ['메모'],
};

/**
 * 앱에서 내보낸 CSV 백업 파일을 거래 내역으로 변환
 */
export async function importFromCsvFile(file: File): Promise<CsvImportResult> {
  const text = (await readFileText(file)).replace(/^﻿/, '');
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error('CSV 파일에 불러올 데이터가 없습니다.');
  }

  // 헤더 → 열 번호 매핑
  const header = rows[0].map((h) => h.trim());
  const col: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx >= 0) col[key] = idx;
  }
  const required = ['type', 'date', 'content', 'amount'];
  const missing = required.filter((k) => col[k] === undefined);
  if (missing.length > 0) {
    throw new Error(
      '가계부 CSV 형식이 아닙니다. 필요한 열(거래유형, 날짜, 내용, 원금액)을 찾지 못했습니다.'
    );
  }

  const get = (r: string[], key: string): string =>
    col[key] === undefined ? '' : (r[col[key]] ?? '').trim();

  const errors: CsvImportResult['errors'] = [];
  const occurrence = new Map<string, number>();
  const transactions: Transaction[] = [];

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const date = normalizeDate(get(r, 'date'));
    if (!date) {
      errors.push({ line, reason: `날짜 형식을 읽을 수 없습니다 ("${get(r, 'date')}")` });
      return;
    }
    const typeRaw = get(r, 'type');
    if (typeRaw !== '수입' && typeRaw !== '지출') {
      errors.push({ line, reason: `거래유형이 '수입' 또는 '지출'이 아닙니다 ("${typeRaw}")` });
      return;
    }
    const type = typeRaw === '수입' ? 'income' : 'expense';
    const content = get(r, 'content') || '내용 없음';
    const amount = parseAmount(get(r, 'amount'));
    const discountAmount = parseAmount(get(r, 'discountAmount'));
    const time = normalizeTime(get(r, 'time'));
    const memo = get(r, 'memo');

    const base = {
      type,
      date,
      time,
      paymentMethod: get(r, 'paymentMethod') || (type === 'income' ? '계좌입금' : '삼성카드'),
      mainCategory: get(r, 'mainCategory') || '미분류',
      subCategory: get(r, 'subCategory') || '기타',
      content,
      amount,
      discountAmount,
      memo,
    };

    // 같은 내용의 거래가 여러 건이어도 각각 다른 고정 ID를 갖도록 순번을 붙임
    const key = transactionDedupeKey(base);
    const n = occurrence.get(key) ?? 0;
    occurrence.set(key, n + 1);

    transactions.push({
      id: `csv-${hashString(key)}-${n}`,
      type,
      date,
      time,
      mainCategory: base.mainCategory,
      subCategory: base.subCategory,
      content,
      description: content,
      amount,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      paymentMethod: base.paymentMethod,
      memo: memo || undefined,
    });
  });

  if (transactions.length === 0) {
    const first = errors[0];
    throw new Error(
      first
        ? `불러올 수 있는 거래가 없습니다. (${first.line}번째 줄: ${first.reason})`
        : 'CSV 파일에 불러올 데이터가 없습니다.'
    );
  }

  return { transactions, errors };
}

/**
 * 기존 내역과 비교해 새 거래만 골라낸다. 내용이 같은 거래는 건수까지 맞춰 중복으로 본다.
 */
export function filterNewTransactions(
  existing: Transaction[],
  incoming: Transaction[]
): Transaction[] {
  const counts = new Map<string, number>();
  for (const t of existing) {
    const k = transactionDedupeKey(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const result: Transaction[] = [];
  for (const t of incoming) {
    const k = transactionDedupeKey(t);
    const left = counts.get(k) ?? 0;
    if (left > 0) {
      counts.set(k, left - 1);
    } else {
      result.push(t);
    }
  }
  return result;
}
