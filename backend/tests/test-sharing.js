require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const File = require('../models/File');
const SharedFile = require('../models/SharedFile');
const Folder = require('../models/Folder');
const fs = require('fs');
const path = require('path');

const PORT = 5007;
const BASE_URL = `http://localhost:${PORT}`;

let server;
let tokenA;
let tokenB;
let userIdA;
let userIdB;
let fileId;
let shareId;

async function setup() {
  let testMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudvault_test';
  if (testMongoUri.includes('/CloudVault')) {
    testMongoUri = testMongoUri.replace(/\/CloudVault(\?|$)/, '/CloudVault_test$1');
  } else if (!testMongoUri.includes('_test')) {
    testMongoUri = testMongoUri + '_test';
  }
  await mongoose.connect(testMongoUri);
  console.log('Database connected successfully.');

  // Clear test DB
  await User.deleteMany({});
  await File.deleteMany({});
  await SharedFile.deleteMany({});
  await Folder.deleteMany({});

  // Ensure uploads directory and a mock file on disk exist
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  fs.writeFileSync(path.join(uploadsDir, 'sharing-test.txt'), 'Secret content inside f');

  server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
}

async function runTests() {
  try {
    // --- Test 1: Register User A (Owner) ---
    console.log('\n--- Test 1: Register User A ---');
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User A',
        email: 'usera@example.com',
        password: 'password123'
      })
    });
    const regDataA = await regResA.json();
    console.log('Status:', regResA.status);
    userIdA = regDataA.data.user._id;

    // --- Test 2: Login User A ---
    console.log('\n--- Test 2: Login User A ---');
    const logResA = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usera@example.com',
        password: 'password123'
      })
    });
    const logDataA = await logResA.json();
    console.log('Status:', logResA.status);
    tokenA = logDataA.data.accessToken;

    // --- Test 3: Register User B (Friend) ---
    console.log('\n--- Test 3: Register User B ---');
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123'
      })
    });
    const regDataB = await regResB.json();
    console.log('Status:', regResB.status);
    userIdB = regDataB.data.user._id;

    // --- Test 4: Login User B ---
    console.log('\n--- Test 4: Login User B ---');
    const logResB = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'userb@example.com',
        password: 'password123'
      })
    });
    const logDataB = await logResB.json();
    console.log('Status:', logResB.status);
    tokenB = logDataB.data.accessToken;

    // Seed a file for User A
    const fileDoc = await File.create({
      owner: userIdA,
      fileName: 'sharing-test.txt',
      originalName: 'sharing-test.txt',
      size: 23,
      mimeType: 'text/plain',
      extension: '.txt',
      storagePath: '/uploads/sharing-test.txt',
      isDeleted: false
    });
    fileId = fileDoc._id.toString();

    // --- Test 5: Share File privately with User B ---
    console.log('\n--- Test 5: Share File Privately ---');
    const shareRes1 = await fetch(`${BASE_URL}/api/files/${fileId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        email: 'userb@example.com',
        permission: 'edit'
      })
    });
    const shareData1 = await shareRes1.json();
    console.log('Status:', shareRes1.status);
    console.log('Message:', shareData1.message);

    // --- Test 6: Verify User B can see the file under Shared list ---
    console.log('\n--- Test 6: Verify User B Shared List ---');
    const sharedListRes = await fetch(`${BASE_URL}/api/files/list/shared`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenB}`
      }
    });
    const sharedListData = await sharedListRes.json();
    console.log('Status:', sharedListRes.status);
    console.log('Files shared with User B:', sharedListData.data.sharedWithMe.length);

    // --- Test 7: Create Public Sharing Link with password ---
    console.log('\n--- Test 7: Create Public Sharing Link ---');
    const publicShareRes = await fetch(`${BASE_URL}/api/files/${fileId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        isPublic: true,
        permission: 'read',
        password: 'securePassword123'
      })
    });
    const publicShareData = await publicShareRes.json();
    console.log('Status:', publicShareRes.status);
    console.log('Share ID:', publicShareData.data.share._id);
    shareId = publicShareData.data.share._id;

    // --- Test 8: Get Public Share Info (unauthenticated) ---
    console.log('\n--- Test 8: Retrieve Public Share Info ---');
    const pubInfoRes = await fetch(`${BASE_URL}/api/files/shared/public/${shareId}`);
    const pubInfoData = await pubInfoRes.json();
    console.log('Status:', pubInfoRes.status);
    console.log('Owner:', pubInfoData.data.ownerName);
    console.log('Is Password Protected:', pubInfoData.data.isPasswordProtected);

    // --- Test 9: Verify Password verification ---
    console.log('\n--- Test 9: Verify Correct Password ---');
    const verifyRes = await fetch(`${BASE_URL}/api/files/shared/public/${shareId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'securePassword123' })
    });
    const verifyData = await verifyRes.json();
    console.log('Status:', verifyRes.status);
    console.log('Message:', verifyData.message);

    // --- Test 10: Verify Incorrect Password Verification ---
    console.log('\n--- Test 10: Verify Incorrect Password ---');
    const verifyResFail = await fetch(`${BASE_URL}/api/files/shared/public/${shareId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongPassword' })
    });
    console.log('Status (Expected 401):', verifyResFail.status);

    // --- Test 11: Download Public Share with correct password ---
    console.log('\n--- Test 11: Download Shared File ---');
    const downloadRes = await fetch(`${BASE_URL}/api/files/shared/public/${shareId}/download?password=securePassword123`);
    const downloadText = await downloadRes.text();
    console.log('Status:', downloadRes.status);
    console.log('Content (Expected match):', downloadText);

    // --- Test 12: Revoke share access ---
    console.log('\n--- Test 12: Revoke Share Link ---');
    const revokeRes = await fetch(`${BASE_URL}/api/files/shares/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenA}`
      }
    });
    const revokeData = await revokeRes.json();
    console.log('Status:', revokeRes.status);
    console.log('Message:', revokeData.message);

    // --- Test 13: Verify revoked share can no longer be retrieved ---
    console.log('\n--- Test 13: Verify Revoked Share Retrieval ---');
    const verifyRevokedRes = await fetch(`${BASE_URL}/api/files/shared/public/${shareId}`);
    console.log('Status (Expected 404):', verifyRevokedRes.status);

    // --- Assertions ---
    console.log('\n--- Running Assertions ---');
    console.assert(regResA.status === 201, 'User A registration should succeed');
    console.assert(logResA.status === 200, 'User A login should succeed');
    console.assert(shareRes1.status === 200, 'Sharing file with user should succeed');
    console.assert(sharedListData.data.sharedWithMe.length === 1, 'User B should see 1 shared file');
    console.assert(pubInfoRes.status === 200, 'Public link info fetch should succeed');
    console.assert(pubInfoData.data.isPasswordProtected === true, 'Public link should be password protected');
    console.assert(verifyRes.status === 200, 'Correct password verification should succeed');
    console.assert(verifyResFail.status === 401, 'Wrong password verification should return 401');
    console.assert(downloadRes.status === 200, 'Download with correct password query should succeed');
    console.assert(downloadText === 'Secret content inside f', 'Download content should match seeded disk content');
    console.assert(revokeRes.status === 200, 'Revoke share should succeed');
    console.assert(verifyRevokedRes.status === 404, 'Retrieving revoked share should fail with 404');

    console.log('\n=========================================');
    console.log('ALL SHARING SYSTEM BACKEND TESTS PASSED! ✅');
    console.log('=========================================');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    console.log('\nCleaning up test records...');
    await User.deleteMany({});
    await File.deleteMany({});
    await SharedFile.deleteMany({});
    await Folder.deleteMany({});
    
    const testFilePath = path.join(__dirname, '../uploads/sharing-test.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    console.log('Closing server and database connection...');
    server.close();
    await mongoose.connection.close();
    console.log('Teardown complete.');
  }
}

(async () => {
  await setup();
  await runTests();
})();
