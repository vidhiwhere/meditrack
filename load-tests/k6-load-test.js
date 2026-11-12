import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const loginDuration = new Trend('login_duration');
const listDuration = new Trend('list_appointments_duration');
const errorRate = new Rate('error_rate');

// Target URLs (default to live Render backend or local backend via env var)
const BASE_URL = __ENV.TARGET_URL || 'https://meditrack-zetl.onrender.com';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp-up to 5 users
    { duration: '20s', target: 20 },  // Steady state at 20 virtual users
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% of all HTTP requests must complete within 800ms (accounting for Render cloud latency)
    http_req_duration: ['p(95)<800'],
    // Overall error rate must stay below 2%
    error_rate: ['rate<0.02'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  // 1. Authenticate as demo patient
  const loginPayload = JSON.stringify({
    email: 'patient1@lumia.com',
    password: 'pat123',
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: '15s',
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);
  loginDuration.add(loginRes.timings.duration);

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returned access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.accessToken !== undefined;
      } catch (_) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const token = JSON.parse(loginRes.body).accessToken;

  // 2. Fetch appointments list using Bearer token
  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    timeout: '15s',
  };

  const listRes = http.get(`${BASE_URL}/api/appointment/list`, authParams);
  listDuration.add(listRes.timings.duration);

  const listSuccess = check(listRes, {
    'appointments status is 200': (r) => r.status === 200,
    'appointments returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch (_) {
        return false;
      }
    },
  });

  if (!listSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  // Think time between user actions (1-2s)
  sleep(1 + Math.random());
}

