/**
 * Cloudflare Pages Functions: /api/transactions
 * - GET: 모든 가계부 내역 조회 (D1)
 * - POST: 신규 가계부 내역 등록 (D1)
 */

export async function onRequestGet(context) {
  try {
    const { env, request } = context;

    if (!env.DB) {
      return new Response(
        JSON.stringify({
          error: 'Cloudflare D1 데이터베이스가 바인딩되지 않았습니다. wrangler.toml 설정을 확인해 주세요.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month'); // YYYY-MM (선택적 필터)

    let query = 'SELECT * FROM transactions';
    let params = [];

    if (month) {
      query += ' WHERE date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY date DESC, createdAt DESC';

    const stmt = env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || '데이터베이스 조회 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: 'Cloudflare D1 데이터베이스가 바인딩되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const data = await request.json();

    // 일괄(배치) 등록 지원 (백업 파일 일괄 복원 등)
    if (Array.isArray(data)) {
      const insertQuery = `
        INSERT OR REPLACE INTO transactions (
          id, date, type, mainCategory, subCategory, content,
          amount, discountAmount, paymentMethod, memo, time, receiptImage, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const statements = data.map((item) => {
        const id = item.id ? String(item.id) : String(Date.now() + Math.random());
        const date = String(item.date);
        const type = item.type === 'income' ? 'income' : 'expense';
        const mainCategory = String(item.mainCategory || '미분류');
        const subCategory = String(item.subCategory || '기타');
        const content = String(item.content || item.description || '내용 없음');
        const amount = Number(item.amount) || 0;
        const discountAmount = Number(item.discountAmount) || 0;
        const paymentMethod = String(item.paymentMethod || (type === 'income' ? '계좌입금' : '삼성카드'));
        const memo = item.memo ? String(item.memo) : null;
        const time = item.time ? String(item.time) : null;
        const receiptImage = item.receiptImage ? String(item.receiptImage) : null;
        const createdAt = item.createdAt || new Date().toISOString();
        return env.DB.prepare(insertQuery).bind(
          id, date, type, mainCategory, subCategory, content,
          amount, discountAmount, paymentMethod, memo, time, receiptImage, createdAt
        );
      });
      await env.DB.batch(statements);
      return new Response(JSON.stringify({ success: true, count: data.length }), {
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    if (!data.date || !data.content || typeof data.amount !== 'number') {
      return new Response(
        JSON.stringify({ error: '필수 항목(날짜, 내용, 금액)이 누락되었습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const id = data.id ? String(data.id) : String(Date.now());
    const date = String(data.date);
    const type = data.type === 'income' ? 'income' : 'expense';
    const mainCategory = String(data.mainCategory || '미분류');
    const subCategory = String(data.subCategory || '기타');
    const content = String(data.content || data.description || '내용 없음');
    const amount = Number(data.amount) || 0;
    const discountAmount = Number(data.discountAmount) || 0;
    const paymentMethod = String(data.paymentMethod || (type === 'income' ? '계좌입금' : '삼성카드'));
    const memo = data.memo ? String(data.memo) : null;
    const time = data.time ? String(data.time) : null;
    const receiptImage = data.receiptImage ? String(data.receiptImage) : null;
    const createdAt = data.createdAt || new Date().toISOString();

    const insertQuery = `
      INSERT OR REPLACE INTO transactions (
        id, date, type, mainCategory, subCategory, content,
        amount, discountAmount, paymentMethod, memo, time, receiptImage, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await env.DB.prepare(insertQuery)
      .bind(
        id,
        date,
        type,
        mainCategory,
        subCategory,
        content,
        amount,
        discountAmount,
        paymentMethod,
        memo,
        time,
        receiptImage,
        createdAt
      )
      .run();

    const savedTransaction = {
      id,
      date,
      type,
      mainCategory,
      subCategory,
      content,
      description: content,
      amount,
      discountAmount,
      paymentMethod,
      memo: memo || undefined,
      time: time || undefined,
      receiptImage: receiptImage || undefined,
      createdAt,
    };

    return new Response(JSON.stringify(savedTransaction), {
      status: 201,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || '데이터베이스 저장 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
