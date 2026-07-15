require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');

const PORT = 5002;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_USER_URL = `http://localhost:${PORT}/api/users`;

const testUser = {
  name: 'Profile Test User',
  email: 'profiletest@example.com',
  password: 'password123',
};

async function runTests() {
  console.log('Connecting to database...');
  try {
    await mongoose.connect(process.env.MONGO_URI);
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

      // 1. Register User
      console.log('\n--- Test 1: Register User ---');
      const regRes = await fetch(`${BASE_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      const regData = await regRes.json();
      console.log('Status:', regRes.status);
      console.log('Response:', JSON.stringify(regData));
      if (regRes.status !== 201) {
        throw new Error('Registration failed');
      }

      // 2. Login User
      console.log('\n--- Test 2: Login User ---');
      const loginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });
      const loginData = await loginRes.json();
      console.log('Status:', loginRes.status);
      if (loginRes.status !== 200) {
        throw new Error('Login failed');
      }
      accessToken = loginData.data.accessToken;

      // 3. Get Profile
      console.log('\n--- Test 3: Get Profile ---');
      const profileRes = await fetch(`${BASE_USER_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const profileData = await profileRes.json();
      console.log('Status:', profileRes.status);
      console.log('Response:', JSON.stringify(profileData));
      if (profileRes.status !== 200) {
        throw new Error('Get Profile failed');
      }
      const user = profileData.data.user;
      if (user.storageUsed === undefined || user.storageLimit === undefined || user.plan === undefined) {
        throw new Error('Profile is missing storageUsed, storageLimit, or plan fields');
      }
      console.log('Storage details and plan verified successfully.');

      // 4. Update Profile
      console.log('\n--- Test 4: Update Profile (Name) ---');
      const updateRes = await fetch(`${BASE_USER_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Jane Doe' }),
      });
      const updateData = await updateRes.json();
      console.log('Status:', updateRes.status);
      console.log('Response:', JSON.stringify(updateData));
      if (updateRes.status !== 200 || updateData.data.user.name !== 'Jane Doe') {
        throw new Error('Update Profile failed');
      }

      // 5. Upload Avatar
      console.log('\n--- Test 5: Upload Avatar ---');
      const formData = new FormData();
      const mockBlob = new Blob(['mock image data'], { type: 'image/png' });
      formData.append('avatar', mockBlob, 'avatar.png');

      const avatarRes = await fetch(`${BASE_USER_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const avatarData = await avatarRes.json();
      console.log('Status:', avatarRes.status);
      console.log('Response:', JSON.stringify(avatarData));
      if (avatarRes.status !== 200 || !avatarData.data.user.avatar.startsWith('/uploads/')) {
        throw new Error('Upload Avatar failed');
      }

      // 6. Change Password (Successful Path)
      console.log('\n--- Test 6: Change Password (Success) ---');
      const changePasswordRes = await fetch(`${BASE_USER_URL}/profile/password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        }),
      });
      const changePasswordData = await changePasswordRes.json();
      console.log('Status:', changePasswordRes.status);
      console.log('Response:', JSON.stringify(changePasswordData));
      if (changePasswordRes.status !== 200) {
        throw new Error('Change password failed');
      }

      // 7. Verify Old Password Login Fails
      console.log('\n--- Test 7: Login with Old Password (Should Fail) ---');
      const oldLoginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });
      console.log('Status:', oldLoginRes.status);
      if (oldLoginRes.status !== 401) {
        throw new Error('Login with old password should have been unauthorized (401)');
      }

      // 8. Verify New Password Login Succeeds
      console.log('\n--- Test 8: Login with New Password (Should Succeed) ---');
      const newLoginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: 'newpassword123' }),
      });
      console.log('Status:', newLoginRes.status);
      if (newLoginRes.status !== 200) {
        throw new Error('Login with new password failed');
      }

      console.log('\n=========================================');
      console.log('ALL USER PROFILE TESTS PASSED SUCCESSFULLY! ✅');
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
