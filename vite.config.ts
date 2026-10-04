import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

/**
 * 로컬 개발(npm run dev) 환경에서 Cloudflare D1 API를 모방하는 개발 미들웨어 플러그인
 * - GET /api/transactions
 * - POST /api/transactions
 * - PUT /api/transactions/:id
 * - DELETE /api/transactions/:id
 * 배포 시에는 Cloudflare Pages Functions (functions/api/...)가 D1 DB와 직접 통신합니다.
 */
function localD1MockPlugin(): Plugin {
  const mockFilePath = path.resolve(__dirname, 'local-d1-mock.json');

  const readMockData = () => {
    try {
      if (fs.existsSync(mockFilePath)) {
        const content = fs.readFileSync(mockFilePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to read local mock DB:', e);
    }
    return [];
  };

  const writeMockData = (data: any[]) => {
    try {
      fs.writeFileSync(mockFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write local mock DB:', e);
    }
  };

  return {
    name: 'local-d1-mock-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/transactions')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method;

        // /api/transactions/:id 매칭
        const idMatch = pathname.match(/^\/api\/transactions\/([^/]+)$/);
        const targetId = idMatch ? idMatch[1] : null;

        let bodyData = '';
        req.on('data', (chunk) => {
          bodyData += chunk;
        });

        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          const transactions = readMockData();

          // 1. GET /api/transactions
          if (method === 'GET' && !targetId) {
            const month = url.searchParams.get('month');
            let results = [...transactions];
            if (month) {
              results = results.filter((tx: any) => tx.date && tx.date.startsWith(month));
            }
            results.sort((a: any, b: any) => {
              const dateA = a.date + (a.time || '');
              const dateB = b.date + (b.time || '');
              return dateB.localeCompare(dateA);
            });
            res.statusCode = 200;
            res.end(JSON.stringify(results));
            return;
          }

          // 2. POST /api/transactions
          if (method === 'POST' && !targetId) {
            try {
              const data = JSON.parse(bodyData || '{}');
              // 일괄 배치 등록
              if (Array.isArray(data)) {
                writeMockData(data);
                res.statusCode = 201;
                res.end(JSON.stringify({ success: true, count: data.length }));
                return;
              }

              const newTx = {
                id: data.id ? String(data.id) : String(Date.now()),
                date: String(data.date),
                type: data.type === 'income' ? 'income' : 'expense',
                mainCategory: String(data.mainCategory || '미분류'),
                subCategory: String(data.subCategory || '기타'),
                content: String(data.content || data.description || '내용 없음'),
                description: String(data.content || data.description || '내용 없음'),
                amount: Number(data.amount) || 0,
                discountAmount: Number(data.discountAmount) || 0,
                paymentMethod: String(data.paymentMethod || (data.type === 'income' ? '계좌입금' : '삼성카드')),
                memo: data.memo || undefined,
                time: data.time || undefined,
                receiptImage: data.receiptImage || undefined,
                createdAt: data.createdAt || new Date().toISOString(),
              };

              transactions.unshift(newTx);
              writeMockData(transactions);

              res.statusCode = 201;
              res.end(JSON.stringify(newTx));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          // 3. PUT /api/transactions/:id
          if (method === 'PUT' && targetId) {
            try {
              const data = JSON.parse(bodyData || '{}');
              const index = transactions.findIndex((tx: any) => String(tx.id) === targetId);
              if (index === -1) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: '해당 내역을 찾을 수 없습니다.' }));
                return;
              }

              const updatedTx = {
                ...transactions[index],
                ...data,
                id: targetId,
              };
              transactions[index] = updatedTx;
              writeMockData(transactions);

              res.statusCode = 200;
              res.end(JSON.stringify(updatedTx));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          // 4. DELETE /api/transactions/:id
          if (method === 'DELETE' && targetId) {
            const nextList = transactions.filter((tx: any) => String(tx.id) !== targetId);
            writeMockData(nextList);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, id: targetId }));
            return;
          }

          res.statusCode = 405;
          res.end(JSON.stringify({ error: '지원하지 않는 HTTP 메서드입니다.' }));
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localD1MockPlugin()],
  server: {
    port: 3000,
    open: true,
  },
});
