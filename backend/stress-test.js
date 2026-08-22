// stress-test.js - Load test for S2R2 Inventory System
// Tests concurrent users (10 admins/editors) performing operations
const http = require('http');

const BASE_URL = 'http://localhost:4000';
const NUM_USERS = 10;
const REQUESTS_PER_USER = 50;

// Test users - using actual system users
const USERS = [
  { username: 'sandeep', password: 'Sandeep@2025', role: 'ADMIN' },
  { username: 'rohan', password: 'Rohan@2025', role: 'ADMIN' },
  { username: 'akshay', password: 'Akshay@2025', role: 'ADMIN' },
  { username: 'emp1', password: 'Emp1@2025', role: 'EDITOR' },
  { username: 'sandeep', password: 'Sandeep@2025', role: 'ADMIN' }, // Reuse
  { username: 'rohan', password: 'Rohan@2025', role: 'ADMIN' },
  { username: 'akshay', password: 'Akshay@2025', role: 'ADMIN' },
  { username: 'emp1', password: 'Emp1@2025', role: 'EDITOR' },
  { username: 'sandeep', password: 'Sandeep@2025', role: 'ADMIN' },
  { username: 'rohan', password: 'Rohan@2025', role: 'ADMIN' },
];

// Performance metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalTime: 0,
  minTime: Infinity,
  maxTime: 0,
  errors: []
};

function makeRequest(path, method = 'GET', token = null, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const startTime = Date.now();
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        metrics.totalRequests++;
        metrics.totalTime += duration;
        metrics.minTime = Math.min(metrics.minTime, duration);
        metrics.maxTime = Math.max(metrics.maxTime, duration);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          metrics.successfulRequests++;
          resolve({ success: true, data: JSON.parse(data || '{}'), duration });
        } else {
          metrics.failedRequests++;
          metrics.errors.push({ path, status: res.statusCode, duration });
          resolve({ success: false, status: res.statusCode, duration });
        }
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      metrics.totalRequests++;
      metrics.failedRequests++;
      metrics.errors.push({ path, error: err.message, duration });
      resolve({ success: false, error: err.message, duration });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function loginUser(username, password) {
  const result = await makeRequest('/api/auth/login', 'POST', null, { username, password });
  return result.success ? result.data.token : null;
}

async function performUserOperations(token, userId) {
  const operations = [
    () => makeRequest('/api/raw-materials', 'GET', token),
    () => makeRequest('/api/finished-products', 'GET', token),
    () => makeRequest('/api/clients', 'GET', token),
    () => makeRequest('/api/dashboard/summary', 'GET', token),
    () => makeRequest('/api/iot-devices', 'GET', token)
  ];

  const results = [];
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const operation = operations[i % operations.length];
    const result = await operation();
    results.push(result);
    
    // Small random delay to simulate real usage
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }
  return results;
}

async function runStressTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  S2R2 INVENTORY SYSTEM - STRESS TEST');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Testing ${NUM_USERS} concurrent users`);
  console.log(`${REQUESTS_PER_USER} requests per user`);
  console.log(`Total expected requests: ${NUM_USERS * REQUESTS_PER_USER}\n`);

  const startTime = Date.now();

  // Simulate concurrent users
  const userPromises = USERS.map(async (user, idx) => {
    console.log(`[User ${idx + 1}] Logging in as ${user.username} (${user.role})...`);
    
    const token = await loginUser(user.username, user.password);
    if (!token) {
      console.log(`[User ${idx + 1}] ❌ Login failed`);
      return;
    }
    
    console.log(`[User ${idx + 1}] ✓ Logged in, performing operations...`);
    await performUserOperations(token, idx + 1);
    console.log(`[User ${idx + 1}] ✓ Completed`);
  });

  await Promise.all(userPromises);

  const totalDuration = Date.now() - startTime;

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Total Duration:        ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Total Requests:        ${metrics.totalRequests}`);
  console.log(`Successful:            ${metrics.successfulRequests} (${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`Failed:                ${metrics.failedRequests} (${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`\nResponse Times:`);
  console.log(`  Average:             ${(metrics.totalTime / metrics.totalRequests).toFixed(2)}ms`);
  console.log(`  Min:                 ${metrics.minTime}ms`);
  console.log(`  Max:                 ${metrics.maxTime}ms`);
  console.log(`\nThroughput:            ${(metrics.totalRequests / (totalDuration / 1000)).toFixed(2)} req/s`);

  if (metrics.errors.length > 0) {
    console.log(`\n⚠ Errors: ${metrics.errors.length}`);
    metrics.errors.slice(0, 5).forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.path || 'Unknown'} - ${err.error || err.status}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  // Performance assessment
  const avgResponseTime = metrics.totalTime / metrics.totalRequests;
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;

  if (successRate >= 95 && avgResponseTime < 500) {
    console.log('✅ EXCELLENT - System handles load well');
  } else if (successRate >= 90 && avgResponseTime < 1000) {
    console.log('✓ GOOD - System performance acceptable');
  } else if (successRate >= 80) {
    console.log('⚠ FAIR - Consider optimization');
  } else {
    console.log('❌ POOR - Immediate optimization required');
  }
}

runStressTest().catch(console.error);
