require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const PORT = 5008;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_FILE_URL = `http://localhost:${PORT}/api/files`;

const testUser = {
  name: 'Chunk Test User',
  email: 'chunktest@example.com',
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

  const db = mongoose.connection;
  // Clean up existing user & files
  await db.collection('users').deleteOne({ email: testUser.email });

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    let success = true;
    let userId = '';
    let accessToken = '';

    try {
      // 1. Register & Login
      console.log('\n--- Test 1: Register and Login ---');
      const regRes = await fetch(`${BASE_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      const regData = await regRes.json();
      if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
      userId = regData.data.user._id;
      console.log(`User registered. ID: ${userId}`);

      const loginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.status !== 200) throw new Error('Login failed');
      accessToken = loginData.data.accessToken;
      console.log('Login successful.');

      // 2. Initialize Chunked Upload
      console.log('\n--- Test 2: Initialize Chunked Upload ---');
      const initPayload = {
        fileName: 'chunk-test.zip',
        fileSize: 3072, // 3KB
        mimeType: 'application/zip',
        folderId: 'root',
        totalChunks: 3,
      };

      const initRes = await fetch(`${BASE_FILE_URL}/upload/chunk/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(initPayload),
      });
      const initData = await initRes.json();
      if (initRes.status !== 201) throw new Error(`Init failed: ${JSON.stringify(initData)}`);
      const { uploadId } = initData.data;
      console.log(`Chunk upload initialized. Upload ID: ${uploadId}`);

      // Check that temp chunk directory is created
      const chunkDir = path.join(__dirname, '../uploads/chunks', uploadId);
      if (!fs.existsSync(chunkDir)) {
        throw new Error('Temporary chunks directory was not created');
      }
      console.log('Temp chunks directory verify: SUCCESS');

      // 3. Upload Chunks (simulating disconnections and out-of-order)
      console.log('\n--- Test 3: Upload Chunks out-of-order ---');
      // Create 3 dummy chunks
      const chunk0Data = Buffer.alloc(1024, 'A');
      const chunk1Data = Buffer.alloc(1024, 'B');
      const chunk2Data = Buffer.alloc(1024, 'C');

      // Upload Chunk 0
      console.log('Uploading Chunk 0...');
      const chunk0Form = new FormData();
      chunk0Form.append('uploadId', uploadId);
      chunk0Form.append('chunkIndex', '0');
      chunk0Form.append('file', new Blob([chunk0Data]), 'chunk-test.zip');

      const chunk0Res = await fetch(`${BASE_FILE_URL}/upload/chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: chunk0Form,
      });
      const chunk0Result = await chunk0Res.json();
      if (chunk0Res.status !== 200) throw new Error(`Chunk 0 upload failed: ${JSON.stringify(chunk0Result)}`);
      console.log('Chunk 0 upload: SUCCESS');

      // Upload Chunk 2 (Skip Chunk 1 for now to simulate disconnection/partial upload)
      console.log('Uploading Chunk 2...');
      const chunk2Form = new FormData();
      chunk2Form.append('uploadId', uploadId);
      chunk2Form.append('chunkIndex', '2');
      chunk2Form.append('file', new Blob([chunk2Data]), 'chunk-test.zip');

      const chunk2Res = await fetch(`${BASE_FILE_URL}/upload/chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: chunk2Form,
      });
      const chunk2Result = await chunk2Res.json();
      if (chunk2Res.status !== 200) throw new Error(`Chunk 2 upload failed: ${JSON.stringify(chunk2Result)}`);
      console.log('Chunk 2 upload: SUCCESS');

      // 4. Query Chunk Status (Resume verification)
      console.log('\n--- Test 4: Verify status endpoint for resuming ---');
      const statusRes = await fetch(`${BASE_FILE_URL}/upload/chunk/status/${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const statusData = await statusRes.json();
      if (statusRes.status !== 200) throw new Error(`Get status failed: ${JSON.stringify(statusData)}`);
      
      const { uploadedChunks } = statusData.data;
      console.log('Server reported uploaded chunks:', uploadedChunks);
      if (!uploadedChunks.includes(0) || !uploadedChunks.includes(2) || uploadedChunks.includes(1)) {
        throw new Error('Uploaded chunks response mismatch');
      }
      console.log('Resumption status check: SUCCESS');

      // 5. Upload remaining Chunk 1
      console.log('\n--- Test 5: Upload missing Chunk 1 ---');
      const chunk1Form = new FormData();
      chunk1Form.append('uploadId', uploadId);
      chunk1Form.append('chunkIndex', '1');
      chunk1Form.append('file', new Blob([chunk1Data]), 'chunk-test.zip');

      const chunk1Res = await fetch(`${BASE_FILE_URL}/upload/chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: chunk1Form,
      });
      const chunk1Result = await chunk1Res.json();
      if (chunk1Res.status !== 200) throw new Error(`Chunk 1 upload failed: ${JSON.stringify(chunk1Result)}`);
      console.log('Chunk 1 upload: SUCCESS');

      // 6. Complete Chunk Upload
      console.log('\n--- Test 6: Complete Chunked Upload ---');
      const completeRes = await fetch(`${BASE_FILE_URL}/upload/chunk/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ uploadId }),
      });
      const completeData = await completeRes.json();
      if (completeRes.status !== 201) throw new Error(`Complete upload failed: ${JSON.stringify(completeData)}`);
      console.log('Upload completion call: SUCCESS');

      const fileDoc = completeData.data.file;
      console.log(`Assembled file: ${fileDoc.fileName}, size: ${fileDoc.size}`);

      // Verify the file was created in MongoDB and exists on disk
      const finalFilePath = path.join(__dirname, '../uploads', fileDoc.fileName);
      if (!fs.existsSync(finalFilePath)) {
        throw new Error('Assembled file does not exist on disk');
      }
      
      // Verify contents of the assembled file
      const fileContents = fs.readFileSync(finalFilePath);
      const expectedContents = Buffer.concat([chunk0Data, chunk1Data, chunk2Data]);
      if (!fileContents.equals(expectedContents)) {
        throw new Error('Assembled file contents are corrupted or out of order!');
      }
      console.log('File merge integrity check: SUCCESS');

      // Clean up the created test file from disk and database
      fs.unlinkSync(finalFilePath);
      await db.collection('files').deleteOne({ _id: new mongoose.Types.ObjectId(fileDoc._id) });
      console.log('Cleanup completed successfully.');

    } catch (err) {
      console.error('❌ Test failed with error:', err.message);
      console.error(err.stack);
      success = false;
    } finally {
      // General database cleanup
      await db.collection('users').deleteOne({ email: testUser.email });
      await mongoose.disconnect();
      server.close(() => {
        console.log('Test server closed.');
        process.exit(success ? 0 : 1);
      });
    }
  });
}

runTests();
