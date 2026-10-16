import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuration for the load test
export const options = {
  // Simulating 50 virtual users simultaneously
  vus: 50,
  // The test will run for 1 minute
  duration: '1m',
  thresholds: {
    // 95% of requests must finish within 200ms
    http_req_duration: ['p(95)<200'], 
    // Error rate should be less than 1%
    http_req_failed: ['rate<0.01'],   
  },
};

export default function () {
  // Base URL of your backend (Make sure your backend is running!)
  const BASE_URL = 'http://18.139.3.242:5000/api/v1';

  // 1. Test the Catalog Endpoint
  let resCatalog = http.get(`${BASE_URL}/equipment`);
  check(resCatalog, {
    'catalog status is 200': (r) => r.status === 200,
    // Adjust this check based on how your API responds (e.g. array or paginated object)
    'catalog returns data': (r) => r.body.length > 0, 
  });

  // 2. Test the Categories Endpoint
  let resCategories = http.get(`${BASE_URL}/categories`);
  check(resCategories, {
    'categories status is 200': (r) => r.status === 200,
  });

  // Short pause to simulate realistic user behavior between requests
  sleep(1);
}
