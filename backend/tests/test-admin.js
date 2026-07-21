require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');

const PORT = 5006;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_ADMIN_URL = `http://localhost:${PORT}/api/admin`;

const adminUser = {
  name: 'System Admin',
  email: 'admin_test@example.com',
  password: 'password123',
};

const regularUser = {
  name: 'Regular User',
  email: 'regular_test@example.com',
  password: 'password123',
};

async function runTests() {
  console.log('Connecting to database...');
  try {
    let testMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudvault_test';
    if (testMongoUri.includes('/CloudVault')) {
      testMongoUri = testMongoUri.replace(/\/CloudVault(\?|$)/, '/CloudVault_test$1');
    } else if (!testMongoUri.includes('_test')) {
      testMongoUri = testMongoUri + '_test';
    }
    await mongoose.connect(testMongoUri);
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  // Clean up
  await mongoose.connection.collection('users').deleteMany({
    email: { $in: [adminUser.email, regularUser.email] }
  });

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    let success = true;

    try {
      // 1. Register and login Regular User
      console.log('\n--- 1. Register Regular User ---');
      await fetch(`${BASE_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regularUser),
      });

      const regularLoginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regularUser.email, password: regularUser.password }),
      });
      const regularLoginData = await regularLoginRes.json();
      const regularToken = regularLoginData.data.accessToken;

      // 2. Try to access Admin Stats with Regular User token
      console.log('\n--- 2. Try accessing admin stats as regular user (should fail) ---');
      const unauthorizedStatsRes = await fetch(`${BASE_ADMIN_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${regularToken}` }
      });
      console.log('Status:', unauthorizedStatsRes.status);
      if (unauthorizedStatsRes.status !== 403) {
        throw new Error('Regular user was incorrectly allowed to access admin stats.');
      }
      console.log('Access successfully rejected with 403.');

      // 3. Register Admin User
      console.log('\n--- 3. Register Admin User ---');
      await fetch(`${BASE_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminUser),
      });

      // Update in DB to set role to admin
      await mongoose.connection.collection('users').updateOne(
        { email: adminUser.email },
        { $set: { role: 'admin' } }
      );

      const adminLoginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminUser.email, password: adminUser.password }),
      });
      const adminLoginData = await adminLoginRes.json();
      const adminToken = adminLoginData.data.accessToken;

      // 4. Access Admin Stats with Admin User token
      console.log('\n--- 4. Access admin stats as admin user (should succeed) ---');
      const adminStatsRes = await fetch(`${BASE_ADMIN_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('Status:', adminStatsRes.status);
      const adminStatsData = await adminStatsRes.json();
      if (adminStatsRes.status !== 200) {
        throw new Error('Admin failed to access admin stats.');
      }
      console.log('Stats loaded successfully:', JSON.stringify(adminStatsData.data.stats));

      // 5. Toggle block state of regular user
      console.log('\n--- 5. Block regular user ---');
      const targetUser = await mongoose.connection.collection('users').findOne({ email: regularUser.email });
      const blockRes = await fetch(`${BASE_ADMIN_URL}/users/${targetUser._id}/toggle-block`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('Status:', blockRes.status);
      if (blockRes.status !== 200) {
        throw new Error('Admin failed to block regular user.');
      }
      console.log('User blocked successfully.');

      // 6. Try to login with blocked user
      console.log('\n--- 6. Attempt login as blocked user (should fail) ---');
      const blockedLoginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regularUser.email, password: regularUser.password }),
      });
      console.log('Status:', blockedLoginRes.status);
      const blockedLoginData = await blockedLoginRes.json();
      console.log('Response Message:', blockedLoginData.message);
      if (blockedLoginRes.status !== 403) {
        throw new Error('Blocked user was incorrectly allowed to log in.');
      }
      console.log('Blocked user login successfully rejected with 403.');

      // 7. Unblock regular user
      console.log('\n--- 7. Unblock regular user ---');
      const unblockRes = await fetch(`${BASE_ADMIN_URL}/users/${targetUser._id}/toggle-block`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (unblockRes.status !== 200) {
        throw new Error('Admin failed to unblock user.');
      }
      console.log('User unblocked successfully.');

      console.log('\nALL ADMIN SYSTEM BACKEND TESTS PASSED! ✅');
    } catch (err) {
      console.error('\nTest execution failed: ❌', err.message);
      success = false;
    } finally {
      // Clean up
      await mongoose.connection.collection('users').deleteMany({
        email: { $in: [adminUser.email, regularUser.email] }
      });
      await mongoose.disconnect();
      server.close(() => {
        console.log('Test server shut down.');
        process.exit(success ? 0 : 1);
      });
    }
  });
}

runTests();
