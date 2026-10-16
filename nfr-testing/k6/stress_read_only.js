import http from 'k6/http';
import { check, sleep } from 'k6';

const base = __ENV.BASE_URL || 'http://127.0.0.1:5000';

// Controlled exploratory local stress profile. The previous load profile peaked
// at 5 VUs; these stages progressively go to 10, 20, and 30 VUs, then return to 0.
// Requests remain read-only. Run only against the local/test environment.
export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '15s', target: 10 },
    { duration: '15s', target: 20 },
    { duration: '15s', target: 30 },
    { duration: '15s', target: 0 },
  ],
};

export default function () {
  const health = http.get(`${base}/health`);
  check(health, { 'health returns HTTP 200': (r) => r.status === 200 });

  const catalog = http.get(`${base}/api/v1/equipment`);
  check(catalog, { 'equipment catalog returns HTTP 200': (r) => r.status === 200 });
  sleep(0.5);
}
