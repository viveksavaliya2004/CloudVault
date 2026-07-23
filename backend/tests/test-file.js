require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const PORT = 5004;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_FILE_URL = `http://localhost:${PORT}/api/files`;

const testUser = {
  name: 'File Test User',
  email: 'filetest@example.com',
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

    try {
      let accessToken = '';

      // 1. Register & Login
      console.log('\n--- Test 1: Register and Login ---');
      const regRes = await fetch(`${BASE_AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      const regData = await regRes.json();
      if (regRes.status !== 201) throw new Error('Registration failed');
      userId = regData.data.user._id;

      const loginRes = await fetch(`${BASE_AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.status !== 200) throw new Error('Login failed');
      accessToken = loginData.data.accessToken;

      // Verify initial storage
      const initialUser = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      console.log('Initial storageUsed:', initialUser.storageUsed);
      if (initialUser.storageUsed !== 0) throw new Error('Initial storageUsed should be 0');

      // 2. Upload Single Image File
      console.log('\n--- Test 2: Upload Single Image File ---');
      const singleForm = new FormData();
      const mockImageBlob = new Blob(['PNG_MOCK_IMAGE_DATA_BYTES'], { type: 'image/png' });
      singleForm.append('file', mockImageBlob, 'test-image.png');

      const uploadRes = await fetch(`${BASE_FILE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: singleForm,
      });
      const uploadData = await uploadRes.json();
      console.log('Status:', uploadRes.status);
      console.log('Response:', JSON.stringify(uploadData));
      if (uploadRes.status !== 201) throw new Error('Single image upload failed');
      const fileId = uploadData.data.file._id;

      // Verify storage used updated
      const userAfterUpload = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      console.log('StorageUsed after upload:', userAfterUpload.storageUsed);
      if (userAfterUpload.storageUsed !== mockImageBlob.size) {
        throw new Error(`StorageUsed is incorrect. Expected ${mockImageBlob.size}, got ${userAfterUpload.storageUsed}`);
      }

      // 2.1. Duplicate Upload Naming Convention
      console.log('\n--- Test 2.1: Duplicate Upload Naming Convention ---');
      const dupForm1 = new FormData();
      dupForm1.append('file', mockImageBlob, 'test-image.png');

      const dupRes1 = await fetch(`${BASE_FILE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: dupForm1,
      });
      const dupData1 = await dupRes1.json();
      console.log('Duplicate 1 Status:', dupRes1.status, 'fileName:', dupData1.data.file.fileName);
      if (dupRes1.status !== 201) throw new Error('First duplicate upload failed');
      if (dupData1.data.file.fileName !== 'test-image (1).png') {
        throw new Error(`Expected fileName to be "test-image (1).png", got "${dupData1.data.file.fileName}"`);
      }

      const dupForm2 = new FormData();
      dupForm2.append('file', mockImageBlob, 'test-image.png');

      const dupRes2 = await fetch(`${BASE_FILE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: dupForm2,
      });
      const dupData2 = await dupRes2.json();
      console.log('Duplicate 2 Status:', dupRes2.status, 'fileName:', dupData2.data.file.fileName);
      if (dupRes2.status !== 201) throw new Error('Second duplicate upload failed');
      if (dupData2.data.file.fileName !== 'test-image (2).png') {
        throw new Error(`Expected fileName to be "test-image (2).png", got "${dupData2.data.file.fileName}"`);
      }

      // 3. Format Validation - Disallowed format
      console.log('\n--- Test 3: Format Validation (Upload Executable file) ---');
      const badForm = new FormData();
      const mockExeBlob = new Blob(['MZ_EXECUTABLE_BYTES'], { type: 'application/octet-stream' });
      badForm.append('file', mockExeBlob, 'malware.exe');

      const badUploadRes = await fetch(`${BASE_FILE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: badForm,
      });
      const badUploadData = await badUploadRes.json();
      console.log('Status:', badUploadRes.status);
      console.log('Response:', JSON.stringify(badUploadData));
      if (badUploadRes.status !== 400) throw new Error('Disallowed format upload should have failed with 400');

      // 4. Size Validation - File exceeds limit (PDF > 15MB)
      console.log('\n--- Test 4: Size Validation (PDF > 15MB) ---');
      const hugeForm = new FormData();
      // Mocking 16MB file
      const hugeBlob = new Blob([new Uint8Array(16 * 1024 * 1024)], { type: 'application/pdf' });
      hugeForm.append('file', hugeBlob, 'huge.pdf');

      const hugeRes = await fetch(`${BASE_FILE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: hugeForm,
      });
      const hugeData = await hugeRes.json();
      console.log('Status:', hugeRes.status);
      console.log('Response:', JSON.stringify(hugeData));
      if (hugeRes.status !== 400) throw new Error('Huge PDF upload should have failed with 400');

      // 5. Storage Limit Exhaustion
      console.log('\n--- Test 5: Storage Limit Exhaustion ---');
      // Set user storage limit to very small (e.g. 100 bytes)
      await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: { storageLimit: 50 } }
      );

      const smallLimitForm = new FormData();
      const mockPdfBlob = new Blob(['SOME_PDF_CONTENT_BYTES_OF_SIZE_GREATER_THAN_100_BYTES_TO_EXCEED_LIMIT'], { type: 'application/pdf' });
      smallLimitForm.append('file', mockPdfBlob, 'small.pdf');

      const limitRes = await fetch(`${BASE_FILE_URL}/upload/single`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: smallLimitForm,
      });
      const limitData = await limitRes.json();
      console.log('Status:', limitRes.status);
      console.log('Response:', JSON.stringify(limitData));
      if (limitRes.status !== 400) throw new Error('Exceeding storage limit should have failed with 400');

      // Restore user storage limit
      await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: { storageLimit: 5368709120 } }
      );

      // 6. Multiple Files Upload
      console.log('\n--- Test 6: Multiple Files Upload ---');
      const multiForm = new FormData();
      const imgBlob1 = new Blob(['IMAGE_1_BYTES'], { type: 'image/png' });
      const imgBlob2 = new Blob(['IMAGE_2_BYTES'], { type: 'image/png' });
      multiForm.append('files', imgBlob1, 'img1.png');
      multiForm.append('files', imgBlob2, 'img2.png');

      const multiRes = await fetch(`${BASE_FILE_URL}/upload/multiple`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: multiForm,
      });
      const multiData = await multiRes.json();
      console.log('Status:', multiRes.status);
      console.log('Response:', JSON.stringify(multiData));
      if (multiRes.status !== 201) throw new Error('Multiple upload failed');

      // 7. Video Range Streaming
      console.log('\n--- Test 7: Video Range Streaming ---');
      // Let's create a mock video file document and save a dummy video file on disk
      const videoFilename = `test-video-${Date.now()}.mp4`;
      const videoPath = path.join(__dirname, '../uploads', videoFilename);
      fs.writeFileSync(videoPath, Buffer.alloc(10 * 1024 * 1024)); // 10MB dummy video

      const videoDoc = await db.collection('files').insertOne({
        owner: new mongoose.Types.ObjectId(userId),
        folderId: null,
        fileName: 'test-video.mp4',
        originalName: 'test-video.mp4',
        size: 10 * 1024 * 1024,
        mimeType: 'video/mp4',
        extension: '.mp4',
        storagePath: `/uploads/${videoFilename}`,
        isDeleted: false,
      });
      const videoId = videoDoc.insertedId;

      // Stream with Range header
      const streamRes = await fetch(`${BASE_FILE_URL}/${videoId}/view`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Range': 'bytes=0-1023',
        },
      });
      console.log('Status:', streamRes.status);
      console.log('Content-Range:', streamRes.headers.get('Content-Range'));
      console.log('Content-Length:', streamRes.headers.get('Content-Length'));
      if (streamRes.status !== 206 || streamRes.headers.get('Content-Length') !== '1024') {
        throw new Error('Video Range streaming failed');
      }

      // 8. Soft Delete File
      console.log('\n--- Test 8: Soft Delete File ---');
      const userBeforeDel = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      const sizeBefore = userBeforeDel.storageUsed;

      const delRes = await fetch(`${BASE_FILE_URL}/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const delData = await delRes.json();
      console.log('Status:', delRes.status);
      console.log('Response:', JSON.stringify(delData));
      if (delRes.status !== 200) throw new Error('File delete failed');

      // Verify storage decremented
      const userAfterDel = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      console.log('StorageUsed before delete:', sizeBefore, 'after delete:', userAfterDel.storageUsed);
      if (userAfterDel.storageUsed !== sizeBefore - mockImageBlob.size) {
        throw new Error('Storage was not decremented correctly on soft delete');
      }

      // 9. Restore File
      console.log('\n--- Test 9: Restore File ---');
      const restoreRes = await fetch(`${BASE_FILE_URL}/${fileId}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const restoreData = await restoreRes.json();
      console.log('Status:', restoreRes.status);
      console.log('Response:', JSON.stringify(restoreData));
      if (restoreRes.status !== 200) throw new Error('File restore failed');

      // Verify storage incremented again
      const userAfterRestore = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userId) });
      console.log('StorageUsed after restore:', userAfterRestore.storageUsed);
      if (userAfterRestore.storageUsed !== sizeBefore) {
        throw new Error('Storage was not incremented correctly on restore');
      }

      // 10. Rename File
      console.log('\n--- Test 10: Rename File ---');
      const renameRes = await fetch(`${BASE_FILE_URL}/${fileId}/rename`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'renamed-image.png' }),
      });
      const renameData = await renameRes.json();
      console.log('Status:', renameRes.status);
      console.log('Response:', JSON.stringify(renameData));
      if (renameRes.status !== 200 || renameData.data.file.fileName !== 'renamed-image.png') {
        throw new Error('File rename failed');
      }

      // 11. Favourite and Star
      console.log('\n--- Test 11: Favourite and Star File ---');
      const favRes = await fetch(`${BASE_FILE_URL}/${fileId}/favourite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavourite: true }),
      });
      const favData = await favRes.json();
      console.log('Favourite Status:', favRes.status, 'isFavourite:', favData.data.file.isFavourite);

      const starRes = await fetch(`${BASE_FILE_URL}/${fileId}/star`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isStarred: true }),
      });
      const starData = await starRes.json();
      console.log('Star Status:', starRes.status, 'isStarred:', starData.data.file.isStarred);

      if (favRes.status !== 200 || !favData.data.file.isFavourite || starRes.status !== 200 || !starData.data.file.isStarred) {
        throw new Error('Star or Favourite operations failed');
      }

      // 12. Archive File
      console.log('\n--- Test 12: Archive File ---');
      const archiveRes = await fetch(`${BASE_FILE_URL}/${fileId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isArchived: true }),
      });
      const archiveData = await archiveRes.json();
      console.log('Archive Status:', archiveRes.status, 'isArchived:', archiveData.data.file.isArchived);
      if (archiveRes.status !== 200 || !archiveData.data.file.isArchived) {
        throw new Error('Archive operation failed');
      }

      // 13. Lock File and verify operations blocked
      console.log('\n--- Test 13: Lock File and Verify Operations Blocked ---');
      const lockRes = await fetch(`${BASE_FILE_URL}/${fileId}/lock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLocked: true }),
      });
      const lockData = await lockRes.json();
      console.log('Lock Status:', lockRes.status, 'isLocked:', lockData.data.file.isLocked);
      if (lockRes.status !== 200 || !lockData.data.file.isLocked) {
        throw new Error('Lock operation failed');
      }

      // Verify rename is blocked
      console.log('\n--- Verifying Rename is Blocked on Locked File ---');
      const failRenameRes = await fetch(`${BASE_FILE_URL}/${fileId}/rename`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'locked-rename.png' }),
      });
      console.log('Rename Status (expected 400):', failRenameRes.status);
      if (failRenameRes.status !== 400) throw new Error('Renaming a locked file should have failed');

      // Verify delete is blocked
      console.log('\n--- Verifying Delete is Blocked on Locked File ---');
      const failDeleteRes = await fetch(`${BASE_FILE_URL}/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      console.log('Delete Status (expected 400):', failDeleteRes.status);
      if (failDeleteRes.status !== 400) throw new Error('Deleting a locked file should have failed');

      // 14. Unlock File and Verify Operations Allowed
      console.log('\n--- Test 14: Unlock File and Verify Operations Allowed ---');
      const unlockRes = await fetch(`${BASE_FILE_URL}/${fileId}/lock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLocked: false }),
      });
      const unlockData = await unlockRes.json();
      console.log('Unlock Status:', unlockRes.status, 'isLocked:', unlockData.data.file.isLocked);
      if (unlockRes.status !== 200 || unlockData.data.file.isLocked) {
        throw new Error('Unlock operation failed');
      }

      // Verify rename now works
      console.log('\n--- Verifying Rename Works After Unlock ---');
      const okRenameRes = await fetch(`${BASE_FILE_URL}/${fileId}/rename`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'unlocked-rename.png' }),
      });
      const okRenameData = await okRenameRes.json();
      console.log('Rename Status:', okRenameRes.status, 'New Name:', okRenameData.data.file.fileName);
      if (okRenameRes.status !== 200 || okRenameData.data.file.fileName !== 'unlocked-rename.png') {
        throw new Error('Rename after unlock failed');
      }

      // Verify delete now works
      console.log('\n--- Verifying Delete Works After Unlock ---');
      const okDeleteRes = await fetch(`${BASE_FILE_URL}/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      console.log('Delete Status:', okDeleteRes.status);
      if (okDeleteRes.status !== 200) throw new Error('Delete after unlock failed');

      console.log('\n=========================================');
      console.log('ALL FILE UPLOAD & OPERATIONS TESTS PASSED SUCCESSFULLY! ✅');
      console.log('=========================================');

    } catch (err) {
      console.error('\n❌ Test failed with error:', err.message);
      console.error(err.stack);
      success = false;
    } finally {
      console.log('\nCleaning up database records & disk files...');
      try {
        await db.collection('users').deleteOne({ email: testUser.email });
        if (userId) {
          const filesToDelete = await db.collection('files').find({ owner: new mongoose.Types.ObjectId(userId) }).toArray();
          for (const file of filesToDelete) {
            const absPath = path.join(__dirname, '../uploads', file.storagePath.replace(/^\/uploads\//, ''));
            if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
          }
          await db.collection('files').deleteMany({ owner: new mongoose.Types.ObjectId(userId) });
        }
      } catch (cleanupErr) {
        console.error('Failed to clean up:', cleanupErr.message);
      }

      console.log('Closing server and database connection...');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Teardown complete.');
        process.exit(success ? 0 : 1);
      });
    }
  });
}

runTests();
