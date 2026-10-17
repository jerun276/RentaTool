import http from 'k6/http';
import { check, sleep } from 'k6';

const base = __ENV.BASE_URL || 'http://127.0.0.1:5000';
export const options = {
  stages: [
    { duration: '10s', target: 1 },
    { duration: '20s', target: 3 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {},
};

export default function () {
  const health = http.get(`${base}/health`);
  check(health, { 'health returns HTTP 200': (r) => r.status === 200 });
  const catalog = http.get(`${base}/api/v1/equipment`);
  check(catalog, { 'equipment catalog returns HTTP 200': (r) => r.status === 200 });
  sleep(1);
}
