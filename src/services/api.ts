import { Transaction } from '../types/transaction';

/**
 * Cloudflare D1 서버리스 API 클라이언트 (/api/transactions)
 */

const API_BASE = '/api/transactions';

/**
 * 모든 거래 내역 또는 특정 월의 거래 내역 조회
 */
export async function fetchTransactionsApi(month?: string): Promise<Transaction[]> {
  const url = month ? `${API_BASE}?month=${encodeURIComponent(month)}` : API_BASE;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `데이터 조회 실패 (상태 코드: ${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * 새 거래 내역 등록
 */
export async function createTransactionApi(
  data: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `거래 내역 등록 실패 (상태 코드: ${res.status})`);
  }

  return await res.json();
}

/**
 * 기존 거래 내역 수정
 */
export async function updateTransactionApi(
  id: string,
  updated: Partial<Transaction>
): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updated),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `거래 내역 수정 실패 (상태 코드: ${res.status})`);
  }

  return await res.json();
}

/**
 * 거래 내역 삭제
 */
export async function deleteTransactionApi(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `거래 내역 삭제 실패 (상태 코드: ${res.status})`);
  }

  return await res.json();
}

/**
 * 복수 거래 내역 일괄 등록 (백업 복원용)
 */
export async function bulkImportTransactionsApi(
  transactions: Transaction[]
): Promise<{ success: boolean; count: number }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactions),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `일괄 등록 실패 (상태 코드: ${res.status})`);
  }

  return await res.json();
}
