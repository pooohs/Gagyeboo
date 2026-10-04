/**
 * Cloudflare Pages Functions: /api/transactions/:id
 * - PUT: 특정 거래 내역 수정 (D1)
 * - DELETE: 특정 거래 내역 삭제 (D1)
 */

export async function onRequestPut(context) {
  try {
    const { env, params, request } = context;
    const id = params.id;

    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: 'Cloudflare D1 데이터베이스가 바인딩되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    const data = await request.json();

    const updateQuery = `
      UPDATE transactions SET
        date = COALESCE(?, date),
        type = COALESCE(?, type),
        mainCategory = COALESCE(?, mainCategory),
        subCategory = COALESCE(?, subCategory),
        content = COALESCE(?, content),
        amount = COALESCE(?, amount),
        discountAmount = COALESCE(?, discountAmount),
        paymentMethod = COALESCE(?, paymentMethod),
        memo = COALESCE(?, memo),
        time = COALESCE(?, time),
        receiptImage = COALESCE(?, receiptImage)
      WHERE id = ?
    `;

    await env.DB.prepare(updateQuery)
      .bind(
        data.date ?? null,
        data.type ?? null,
        data.mainCategory ?? null,
        data.subCategory ?? null,
        data.content ?? data.description ?? null,
        typeof data.amount === 'number' ? data.amount : null,
        typeof data.discountAmount === 'number' ? data.discountAmount : null,
        data.paymentMethod ?? null,
        data.memo ?? null,
        data.time ?? null,
        data.receiptImage ?? null,
        id
      )
      .run();

    // 수정된 항목 조회
    const { results } = await env.DB.prepare('SELECT * FROM transactions WHERE id = ?')
      .bind(id)
      .all();

    return new Response(JSON.stringify(results?.[0] || { id, ...data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || '데이터 수정 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}

export async function onRequestDelete(context) {
  try {
    const { env, params } = context;
    const id = params.id;

    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: 'Cloudflare D1 데이터베이스가 바인딩되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
      );
    }

    await env.DB.prepare('DELETE FROM transactions WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || '데이터 삭제 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
}
