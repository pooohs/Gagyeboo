import { TransactionType } from '../types/transaction';

export interface ParsedSmsResult {
  type: TransactionType;
  date: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  amount: number;
  description: string;
  suggestedMainCategory?: string;
  suggestedSubCategory?: string;
  suggestedPaymentMethod?: string;
  confidence: number;
}

// 텍스트 기반 카테고리 자동 유추 규칙
const CATEGORY_RULES: Array<{
  keywords: string[];
  type: TransactionType;
  main: string;
  sub: string;
}> = [
  // 수입
  { keywords: ['급여', '월급', '상여', '보너스', '기본급'], type: 'income', main: '급여', sub: '월급' },
  { keywords: ['수당', '야근수당', '연차수당'], type: 'income', main: '급여', sub: '수당' },
  { keywords: ['배당', '배당금', '이자', '예금이자', '적금이자'], type: 'income', main: '금융/부수입', sub: '이자/배당금' },
  { keywords: ['당근', '당근마켓', '중고', '중고나라', '번개장터'], type: 'income', main: '금융/부수입', sub: '중고거래' },
  { keywords: ['투자수익', '해외주식', '환급', '캐시백'], type: 'income', main: '금융/부수입', sub: '투자수익' },
  { keywords: ['축의금', '조의금', '축하금'], type: 'income', main: '기타 현금', sub: '축하금' },
  { keywords: ['용돈입금', '부모님용돈'], type: 'income', main: '기타 현금', sub: '용돈' },

  // 지출 - 식비
  { keywords: ['스타벅스', '스벅', '투썸', '이디야', '메가커피', '컴포즈', '빽다방', '폴바셋', '블루보틀', '커피', '카페', '배스킨', '베이커리', '파리바게', '뚜레쥬르', '성심당'], type: 'expense', main: '식비', sub: '카페/간식' },
  { keywords: ['배달의민족', '배민', '요기요', '쿠팡이츠', '배달'], type: 'expense', main: '식비', sub: '배달' },
  { keywords: ['이마트', '홈플러스', '롯데마트', '하나로마트', '마켓컬리', '컬리', '트레이더스', '코스트코', '정육점', '청과', '슈퍼'], type: 'expense', main: '식비', sub: '식재료(마트)' },
  { keywords: ['식당', '갈비', '삼겹살', '스시', '돈까스', '초밥', '파스타', '피자', '버거', '맥도날드', '버거킹', '맘스터치', '롯데리아', '치킨', '교촌', '비비큐', 'bbq', '포차', '국밥', '짜장', '짬뽕', '마라탕', '쌀국수', '우동', '순대국'], type: 'expense', main: '식비', sub: '외식' },

  // 지출 - IT/구독
  { keywords: ['chatgpt', 'openai', 'claude', 'anthropic', 'github', 'adobe', 'jetbrains'], type: 'expense', main: 'IT/구독', sub: 'AI/소프트웨어' },
  { keywords: ['넷플릭스', 'netflix', '유튜브', 'youtube', '디즈니', 'disney', '왓챠', '티빙', '웨이브', '멜론', '스포티파이', 'spotify'], type: 'expense', main: 'IT/구독', sub: '콘텐츠(넷플릭스 등)' },
  { keywords: ['aws', 'google', 'cloud', 'notion', '노션', 'icloud'], type: 'expense', main: 'IT/구독', sub: '클라우드/웹서비스' },

  // 지출 - 주거/통신
  { keywords: ['skt', 'kt', 'lgu+', 'u+', '알뜰폰', '통신'], type: 'expense', main: '주거/통신', sub: '통신비' },
  { keywords: ['한전', '한국전력', '도시가스', '수도요금', '전기요금', '가스요금'], type: 'expense', main: '주거/통신', sub: '공과금' },
  { keywords: ['관리비', '아파트관리비', '월세', '주거'], type: 'expense', main: '주거/통신', sub: '월세/관리비' },

  // 지출 - 생활/용품
  { keywords: ['다이소', '올리브영', 'cu', 'gs25', '세븐일레븐', '이마트24', '편의점'], type: 'expense', main: '생활/용품', sub: '생활용품' },
  { keywords: ['삼성디지털', 'lg베스트', '하이마트', '이케아', '한샘'], type: 'expense', main: '생활/용품', sub: '가전/가구' },
  { keywords: ['미용실', '헤어', '바버', '네일', '의류'], type: 'expense', main: '생활/용품', sub: '의류/미용' },

  // 지출 - 쇼핑
  { keywords: ['백화점', '아울렛', '현대백화점', '신세계', '롯데백화점'], type: 'expense', main: '쇼핑', sub: '백화점/아울렛' },
  { keywords: ['쿠팡', '네이버페이', '11번가', 'g마켓', '옥션', '무신사', '지그재그', '에이블리', 'ssg'], type: 'expense', main: '쇼핑', sub: '온라인쇼핑' },
  { keywords: ['멤버십', '와우멤버십', '네이버플러스'], type: 'expense', main: '쇼핑', sub: '멤버십/포인트' },

  // 지출 - 교통/차량
  { keywords: ['택시', '카카오t', '타다', '티머니', '지하철', '버스', '코레일', 'srt', 'ktx'], type: 'expense', main: '교통/차량', sub: '대중교통(버스/지하철)' },
  { keywords: ['주유소', 'gs칼텍스', 'sk에너지', 's-oil', '현대오일', '전기차충전'], type: 'expense', main: '교통/차량', sub: '전기차충전/주유' },
  { keywords: ['하이패스', '주차장', '파킹', '통행료'], type: 'expense', main: '교통/차량', sub: '통행료/주차' },
  { keywords: ['카센터', '엔진오일', '타이어', '차량정비'], type: 'expense', main: '교통/차량', sub: '차량정비' },

  // 지출 - 건강/의료
  { keywords: ['병원', '의원', '내과', '치과', '안과', '피부과', '정형외과', '한의원', '약국'], type: 'expense', main: '건강/의료', sub: '병원/약국' },
  { keywords: ['헬스', '피트니스', '필라테스', '요가', '수영장'], type: 'expense', main: '건강/의료', sub: '운동/피트니스' },

  // 지출 - 교육비
  { keywords: ['학원', '어학원', '인프런', '패스트캠퍼스', '클래스101', '유데미', '강의', '교보문고', 'yes24', '알라딘', '서점'], type: 'expense', main: '교육비', sub: '온라인강의' },

  // 지출 - 문화/여가
  { keywords: ['cgv', '롯데시네마', '메가박스', '영화', '공연', '티켓', '인터파크티켓', 'pc방', '노래연습장'], type: 'expense', main: '문화/여가', sub: '영화/공연' },

  // 지출 - 세금
  { keywords: ['주민세'], type: 'expense', main: '세금', sub: '주민세' },
  { keywords: ['재산세'], type: 'expense', main: '세금', sub: '재산세' },
  { keywords: ['자동차세'], type: 'expense', main: '세금', sub: '자동차세' },
  { keywords: ['종합소득세', '종소세'], type: 'expense', main: '세금', sub: '종합소득세' },
  { keywords: ['세금', '국세', '지방세', '위택스', 'wetax', '이택스', 'etax', '등록면허세'], type: 'expense', main: '세금', sub: '기타 세금' },
];

/**
 * 한국 결제/입금 문자 (SMS, 카카오톡 알림톡 등) 파싱 함수
 */
export function parsePaymentNotification(rawText: string): ParsedSmsResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. 거래 유형 판별 (수입 vs 지출)
  const isIncome =
    lower.includes('입금') ||
    lower.includes('타행입금') ||
    lower.includes('급여') ||
    lower.includes('수령') ||
    lower.includes('송금받음') ||
    lower.includes('입금완료');
  const type: TransactionType = isIncome ? 'income' : 'expense';

  // 2. 날짜 및 시간 추출
  // 형식: 2026-09-28, 2026.09.28, 09/28, 9/28, 09.28 14:30 등
  let date = '';
  let time = '';

  const currentYear = new Date().getFullYear();

  // YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
  const fullDateMatch = text.match(/(20\d{2})[-/.년]\s*(\d{1,2})[-/.월]\s*(\d{1,2})/);
  if (fullDateMatch) {
    const y = fullDateMatch[1];
    const m = fullDateMatch[2].padStart(2, '0');
    const d = fullDateMatch[3].padStart(2, '0');
    date = `${y}-${m}-${d}`;
  } else {
    // MM/DD or MM.DD
    const shortDateMatch = text.match(/(\d{1,2})[-/.월]\s*(\d{1,2})/);
    if (shortDateMatch) {
      const m = shortDateMatch[1].padStart(2, '0');
      const d = shortDateMatch[2].padStart(2, '0');
      date = `${currentYear}-${m}-${d}`;
    } else {
      const today = new Date();
      date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
  }

  // 시간: HH:mm
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // 3. 금액 추출
  // 패턴: 12,500원, KRW 12,500, 12500원, 금액: 12,500원, [입금] 2,850,000 등
  let amount = 0;
  const amountPatterns = [
    /([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\s*원/,
    /(?:krw|금액|승인금액|입금금액|출금금액)[:\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/i,
    /([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:일시불|체크|승인|입금|잔액)/,
  ];

  for (const regex of amountPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const parsed = parseInt(match[1].replace(/,/g, ''), 10);
      if (parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 4. 사용처/입금처 (Description) 추출
  // 줄 단위 분석: 카드사, 발신 안내, 날짜, 금액, 잔액 등을 제외한 가장 유력한 상호명 탐색
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const noiseKeywords = [
    'web발신',
    '승인',
    '일시불',
    '체크카드',
    '신용카드',
    '누적',
    '잔액',
    '잔여',
    '감사합니다',
    '고객님',
    '님',
    '알림톡',
    'kb국민',
    '신한체크',
    '현대카드',
    '삼성카드',
    '하나카드',
    '우리카드',
    '카카오페이',
    '토스',
    'nh농협',
    '입금안내',
    '출금안내',
  ];

  let candidateDescription = '';

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    // 노이즈 단어만 가득하거나 금액/날짜 전용 라인 제외
    const hasOnlyNoise = noiseKeywords.some(
      (kw) => lineLower === kw || lineLower.startsWith(`[${kw}`)
    );
    const hasAmountOnly = /^[0-9,]+\s*원?$/.test(line);
    const hasDateOnly = /^\d{1,2}[./-]\d{1,2}/.test(line) && line.length < 15;

    if (!hasOnlyNoise && !hasAmountOnly && !hasDateOnly) {
      // 상호명에서 금액이나 날짜가 붙어있으면 정리
      let cleaned = line
        .replace(/[0-9]{1,3}(?:,[0-9]{3})+원?/g, '')
        .replace(/\d{1,2}:\d{2}/g, '')
        .replace(/\d{1,2}[./-]\d{1,2}/g, '')
        .replace(/\[[^\]]+\]/g, '')
        .trim();

      if (cleaned.length > 1 && cleaned.length < 30) {
        candidateDescription = cleaned;
        break;
      }
    }
  }

  if (!candidateDescription && lines.length > 0) {
    candidateDescription = isIncome ? '미분류 입금' : '미분류 지출';
  }

  // 5. 카테고리 유추
  let suggestedMain = type === 'income' ? '급여' : '식비';
  let suggestedSub = type === 'income' ? '월급' : '외식';
  let matched = false;

  for (const rule of CATEGORY_RULES) {
    if (rule.type === type) {
      if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
        suggestedMain = rule.main;
        suggestedSub = rule.sub;
        matched = true;
        break;
      }
    }
  }

  // 6. 결제수단 유추 (삼성/하나/신한/현대/현금/계좌이체)
  let suggestedPaymentMethod = type === 'income' ? '계좌입금' : '삼성카드';
  if (type === 'income') {
    if (lower.includes('현금')) {
      suggestedPaymentMethod = '현금';
    } else {
      suggestedPaymentMethod = '계좌입금';
    }
  } else {
    if (lower.includes('삼성카드') || lower.includes('삼성')) {
      suggestedPaymentMethod = '삼성카드';
    } else if (lower.includes('하나카드') || lower.includes('하나') || lower.includes('외환')) {
      suggestedPaymentMethod = '하나카드';
    } else if (lower.includes('신한카드') || lower.includes('신한체크') || lower.includes('신한')) {
      suggestedPaymentMethod = '신한카드';
    } else if (lower.includes('현대카드') || lower.includes('현대')) {
      suggestedPaymentMethod = '현대카드';
    } else if (lower.includes('현금') || lower.includes('현금영수증')) {
      suggestedPaymentMethod = '현금';
    } else if (lower.includes('이체') || lower.includes('계좌') || lower.includes('송금')) {
      suggestedPaymentMethod = '계좌이체';
    }
  }

  return {
    type,
    date,
    time: time || undefined,
    amount,
    description: candidateDescription,
    suggestedMainCategory: suggestedMain,
    suggestedSubCategory: suggestedSub,
    suggestedPaymentMethod,
    confidence: matched ? 0.9 : 0.5,
  };
}

// 사용자 편의를 위한 대표 샘플 문자 목록 (사용자 소유 4대 카드사 반영)
export const SAMPLE_SMS_LIST = [
  {
    title: '삼성카드 스타벅스 결제 (지출)',
    text: `[Web발신]\n삼성카드 승인\n홍*동님\n10/02 14:30\n스타벅스강남점\n12,500원\n일시불\n누적 432,000원`,
  },
  {
    title: '현대카드 쿠팡 결제 (지출)',
    text: `[현대카드]\n홍길동님\n10/01 20:15\n쿠팡(로켓배송)\n38,000원 승인\n잔액 1,845,000원`,
  },
  {
    title: '하나카드 파스타 점심 (지출)',
    text: `[하나카드] 승인\n10/03 12:40\n이탈리안파스타\n24,000원`,
  },
  {
    title: '신한카드 위택스 주민세 (지출)',
    text: `[Web발신]\n신한카드 승인\n홍*동님\n10/02 10:15\n위택스(주민세)\n62,500원\n일시불`,
  },
  {
    title: '(주)테크솔루션 급여 입금 (수입)',
    text: `[Web발신]\n신한은행 입금\n홍*동님 계좌\n09/25 09:00\n4,200,000원\n(주)테크솔루션 급여\n잔액 5,420,000원`,
  },
  {
    title: '현금 지출 (마트 영수증)',
    text: `[현금영수증]\n발행완료 10/02 17:30\n동네마트 식재료\n18,500원`,
  },
];
