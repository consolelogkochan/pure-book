/**
 * 排他制御（悲観的ロック）の負荷テスト
 *
 * シナリオ: 10人が同じスロット（2026-06-08 10:00, スタッフID:1）に同時予約リクエストを送る
 * 期待結果: 201 Created が1件のみ、残り9件は 409 Conflict
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const created  = new Counter('bookings_created');   // 201
const conflict = new Counter('bookings_conflict');  // 409
const other    = new Counter('bookings_other');     // その他

export const options = {
  scenarios: {
    concurrent_booking: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 10,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // 201 は必ず1件（スタッフ1人 × 同一スロット）
    'bookings_created': ['count == 1'],
    // 409 は必ず9件
    'bookings_conflict': ['count == 9'],
  },
};

const BASE_URL = 'http://localhost/api';

const PAYLOAD = JSON.stringify({
  menu_id:        3,       // カット（90分）
  staff_id:       1,       // Rahul Klein（指名指定でロック競合を明確化）
  start_time:     '2026-06-08 10:00:00',
  customer_name:  'テスト太郎',
  customer_email: 'load-test@example.com',
  customer_phone: '090-0000-0000',
  customer_memo:  '負荷テスト用',
});

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept':       'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

export default function () {
  const res = http.post(`${BASE_URL}/bookings`, PAYLOAD, { headers: HEADERS });

  if (res.status === 201) {
    created.add(1);
    check(res, { '201: 予約成功': () => true });
    console.log(`[VU ${__VU}] 201 Created - ref: ${JSON.parse(res.body)?.data?.booking_reference ?? '-'}`);
  } else if (res.status === 409) {
    conflict.add(1);
    check(res, { '409: 競合検知': () => true });
    console.log(`[VU ${__VU}] 409 Conflict`);
  } else {
    other.add(1);
    console.warn(`[VU ${__VU}] Unexpected status: ${res.status} - ${res.body}`);
  }
}
