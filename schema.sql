-- ==============================================================
-- Cloudflare D1 데이터베이스 가계부 스키마 (schema.sql)
-- ==============================================================
-- 적용 방법:
-- 1. 로컬 테스트: npx wrangler d1 execute account-book-db --local --file=./schema.sql
-- 2. 원격 D1 배포: npx wrangler d1 execute account-book-db --remote --file=./schema.sql
-- ==============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,                -- YYYY-MM-DD (거래 일자)
  type TEXT NOT NULL,                -- 'income' (수입) 또는 'expense' (지출)
  mainCategory TEXT NOT NULL,        -- 1단계 대분류 (식비, 급여, 주거/통신 등)
  subCategory TEXT NOT NULL,         -- 2단계 소분류 (외식, 월급, 공과금 등)
  content TEXT NOT NULL,             -- 사용처 / 내용 / 입금처
  amount INTEGER NOT NULL,           -- 결제 금액 / 입금 금액
  discountAmount INTEGER DEFAULT 0,  -- 카드 청구할인 금액
  paymentMethod TEXT DEFAULT '삼성카드', -- 결제수단 (삼성카드, 하나카드, 신한카드, 현대카드, 현금, 계좌이체 등)
  memo TEXT,                         -- 추가 메모 (선택)
  time TEXT,                         -- 결제 시간 (HH:mm)
  receiptImage TEXT,                 -- 영수증 첨부 이미지 (URL 또는 Base64)
  createdAt TEXT DEFAULT (datetime('now', 'localtime')) -- 생성 일시
);

-- 빠른 월별 및 일별 필터 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- 수입/지출 유형별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 결제수단별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(paymentMethod);
