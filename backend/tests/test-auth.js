require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api/auth`;

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
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

  // Clean up any existing test user
  await mongoose.connection.collection('users').deleteOne({ email: testUser.email });

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    let success = true;

    try {
      let accessToken = '';
      let refreshToken = '';

      // 1. Test Register
      console.log('\n--- Test 1: Register User ---');
      const regRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      const regData = await regRes.json();
      console.log('Status:', regRes.status);
      console.log('Response:', JSON.stringify(regData));
      if (regRes.status !== 201 || regData.status !== 'success') {
        throw new Error('Registration failed');
      }

      // 2. Test Duplicate Register
      console.log('\n--- Test 2: Register Duplicate User ---');
      const dupRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      const dupData = await dupRes.json();
      console.log('Status:', dupRes.status);
      console.log('Response:', JSON.stringify(dupData));
      if (dupRes.status !== 400 || dupData.status !== 'fail') {
        throw new Error('Duplicate registration should have failed with 400');
      }

      // 3. Test Login (Invalid Password)
      console.log('\n--- Test 3: Login (Invalid Password) ---');
      const badLoginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: 'wrongpassword' }),
      });
      const badLoginData = await badLoginRes.json();
      console.log('Status:', badLoginRes.status);
      console.log('Response:', JSON.stringify(badLoginData));
      if (badLoginRes.status !== 401 || badLoginData.status !== 'fail') {
        throw new Error('Login with wrong password should have failed with 401');
      }

      // 4. Test Login (Success)
      console.log('\n--- Test 4: Login (Success) ---');
      const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });
      const loginData = await loginRes.json();
      console.log('Status:', loginRes.status);
      console.log('Response:', JSON.stringify(loginData));
      if (loginRes.status !== 200 || loginData.status !== 'success') {
        throw new Error('Login failed');
      }
      accessToken = loginData.data.accessToken;
      refreshToken = loginData.data.refreshToken;

      // Extract set-cookie header
      const cookieHeader = loginRes.headers.get('set-cookie');
      console.log('Cookie Header:', cookieHeader);

      // 5. Test Protected Route without Token
      console.log('\n--- Test 5: Access Protected Route Without Token ---');
      const noTokenRes = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
      });
      const noTokenData = await noTokenRes.json();
      console.log('Status:', noTokenRes.status);
      console.log('Response:', JSON.stringify(noTokenData));
      if (noTokenRes.status !== 401) {
        throw new Error('Access to protected route without token should have failed with 401');
      }

      // 6. Test Protected Route with Token
      console.log('\n--- Test 6: Access Protected Route With Valid Token ---');
      const authRes = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const authData = await authRes.json();
      console.log('Status:', authRes.status);
      console.log('Response:', JSON.stringify(authData));
      if (authRes.status !== 200 || authData.status !== 'success') {
        throw new Error('Access to protected route failed');
      }

      // 7. Test Refresh Token
      console.log('\n--- Test 7: Refresh Token ---');
      const refreshRes = await fetch(`${BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader || `refreshToken=${refreshToken}`
        },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshData = await refreshRes.json();
      console.log('Status:', refreshRes.status);
      console.log('Response:', JSON.stringify(refreshData));
      if (refreshRes.status !== 200 || refreshData.status !== 'success') {
        throw new Error('Token refresh failed');
      }
      const newAccessToken = refreshData.data.accessToken;
      const newRefreshToken = refreshData.data.refreshToken;
      const newCookieHeader = refreshRes.headers.get('set-cookie');

      // 8. Test Protected Route with New Access Token
      console.log('\n--- Test 8: Access Protected Route With New Access Token ---');
      const newAuthRes = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${newAccessToken}`,
        },
      });
      const newAuthData = await newAuthRes.json();
      console.log('Status:', newAuthRes.status);
      console.log('Response:', JSON.stringify(newAuthData));
      if (newAuthRes.status !== 200 || newAuthData.status !== 'success') {
        throw new Error('Access to protected route using new access token failed');
      }

      // 9. Test Logout
      console.log('\n--- Test 9: Logout ---');
      const logoutRes = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': newCookieHeader || `refreshToken=${newRefreshToken}`
        },
        body: JSON.stringify({ refreshToken: newRefreshToken }),
      });
      const logoutData = await logoutRes.json();
      console.log('Status:', logoutRes.status);
      console.log('Response:', JSON.stringify(logoutData));
      if (logoutRes.status !== 200 || logoutData.status !== 'success') {
        throw new Error('Logout failed');
      }

      // 10. Test Refresh Token after Logout
      console.log('\n--- Test 10: Refresh Token After Logout ---');
      const postLogoutRefreshRes = await fetch(`${BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: newRefreshToken }),
      });
      const postLogoutRefreshData = await postLogoutRefreshRes.json();
      console.log('Status:', postLogoutRefreshRes.status);
      console.log('Response:', JSON.stringify(postLogoutRefreshData));
      if (postLogoutRefreshRes.status !== 401) {
        throw new Error('Refresh after logout should have failed with 401');
      }

      console.log('\n=========================================');
      console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
      console.log('=========================================');
    } catch (error) {
      console.error('\n❌ Test failed with error:', error.message);
      success = false;
    } finally {
      console.log('\nCleaning up test database records...');
      await mongoose.connection.collection('users').deleteOne({ email: testUser.email });
      
      console.log('Closing server and database connection...');
      server.close(() => {
        mongoose.connection.close().then(() => {
          console.log('Teardown complete.');
          process.exit(success ? 0 : 1);
        });
      });
    }
  });
}

runTests();
