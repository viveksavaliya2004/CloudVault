require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');

const PORT = 5003;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_FOLDER_URL = `http://localhost:${PORT}/api/folders`;

const testUser = {
  name: 'Folder Test User',
  email: 'foldertest@example.com',
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

  // Clean up any existing test user & folders/files
  const db = mongoose.connection;
  await db.collection('users').deleteOne({ email: testUser.email });
  
  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    let success = true;
    let userId = '';

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
      if (regRes.status !== 201) {
        throw new Error('Registration failed');
      }
      userId = regData.data.user._id;

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

      // 3. Create Root Folder
      console.log('\n--- Test 3: Create Root Folder A ---');
      const createARes = await fetch(`${BASE_FOLDER_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'FolderA' }),
      });
      const createAData = await createARes.json();
      console.log('Status:', createARes.status);
      console.log('Response:', JSON.stringify(createAData));
      if (createARes.status !== 201 || createAData.data.folder.path !== '/') {
        throw new Error('Create root folder A failed');
      }
      const folderAId = createAData.data.folder._id;

      // 4. Create Duplicate Folder A (Should fail)
      console.log('\n--- Test 4: Create Duplicate Folder A ---');
      const dupARes = await fetch(`${BASE_FOLDER_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'FolderA' }),
      });
      const dupAData = await dupARes.json();
      console.log('Status:', dupARes.status);
      console.log('Response:', JSON.stringify(dupAData));
      if (dupARes.status !== 400) {
        throw new Error('Creating duplicate folder should have failed');
      }

      // 5. Create Nested Folder B inside Folder A
      console.log('\n--- Test 5: Create Nested Folder B inside Folder A ---');
      const createBRes = await fetch(`${BASE_FOLDER_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'FolderB', parentFolder: folderAId }),
      });
      const createBData = await createBRes.json();
      console.log('Status:', createBRes.status);
      console.log('Response:', JSON.stringify(createBData));
      if (createBRes.status !== 201 || createBData.data.folder.path !== '/FolderA') {
        throw new Error('Create nested folder B failed');
      }
      const folderBId = createBData.data.folder._id;

      // 6. Create Nested Folder C inside Folder B
      console.log('\n--- Test 6: Create Nested Folder C inside Folder B ---');
      const createCRes = await fetch(`${BASE_FOLDER_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'FolderC', parentFolder: folderBId }),
      });
      const createCData = await createCRes.json();
      console.log('Status:', createCRes.status);
      console.log('Response:', JSON.stringify(createCData));
      if (createCRes.status !== 201 || createCData.data.folder.path !== '/FolderA/FolderB') {
        throw new Error('Create nested folder C failed');
      }
      const folderCId = createCData.data.folder._id;

      // 7. Get contents of Folder A
      console.log('\n--- Test 7: Get Folder A Contents ---');
      const contentsARes = await fetch(`${BASE_FOLDER_URL}/${folderAId}/contents`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const contentsAData = await contentsARes.json();
      console.log('Status:', contentsARes.status);
      console.log('Subfolders found in Folder A:', contentsAData.data.subfolders.map(f => f.name));
      if (contentsARes.status !== 200 || contentsAData.data.subfolders.length !== 1 || contentsAData.data.subfolders[0].name !== 'FolderB') {
        throw new Error('Get Folder A contents failed');
      }

      // 8. Rename Folder B to FolderB_Renamed
      console.log('\n--- Test 8: Rename Folder B ---');
      const renameBRes = await fetch(`${BASE_FOLDER_URL}/${folderBId}/rename`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'FolderB_Renamed' }),
      });
      const renameBData = await renameBRes.json();
      console.log('Status:', renameBRes.status);
      console.log('Response:', JSON.stringify(renameBData));
      if (renameBRes.status !== 200 || renameBData.data.folder.name !== 'FolderB_Renamed') {
        throw new Error('Rename Folder B failed');
      }

      // Verify that Folder C path updated to /FolderA/FolderB_Renamed
      console.log('\n--- Checking Folder C path after rename ---');
      const updatedFolderC = await db.collection('folders').findOne({ _id: new mongoose.Types.ObjectId(folderCId) });
      console.log('Folder C Path:', updatedFolderC.path);
      if (updatedFolderC.path !== '/FolderA/FolderB_Renamed') {
        throw new Error('Descendant folder path did not update after rename');
      }

      // 9. Create another root Folder D
      console.log('\n--- Test 9: Create Root Folder D ---');
      const createDRes = await fetch(`${BASE_FOLDER_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'FolderD' }),
      });
      const createDData = await createDRes.json();
      console.log('Status:', createDRes.status);
      const folderDId = createDData.data.folder._id;

      // 10. Move Folder B (now renamed) into Folder D
      console.log('\n--- Test 10: Move Folder B under Folder D ---');
      const moveBRes = await fetch(`${BASE_FOLDER_URL}/${folderBId}/move`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetParentId: folderDId }),
      });
      const moveBData = await moveBRes.json();
      console.log('Status:', moveBRes.status);
      console.log('Response:', JSON.stringify(moveBData));
      if (moveBRes.status !== 200 || moveBData.data.folder.parentFolder !== folderDId.toString() || moveBData.data.folder.path !== '/FolderD') {
        throw new Error('Move Folder B failed');
      }

      // Verify that Folder C path updated to /FolderD/FolderB_Renamed
      console.log('\n--- Checking Folder C path after move ---');
      const updatedFolderC2 = await db.collection('folders').findOne({ _id: new mongoose.Types.ObjectId(folderCId) });
      console.log('Folder C Path:', updatedFolderC2.path);
      if (updatedFolderC2.path !== '/FolderD/FolderB_Renamed') {
        throw new Error('Descendant folder path did not update after move');
      }

      // 11. Test Circular Move Prevention (Move D under B)
      console.log('\n--- Test 11: Test Circular Move Prevention (Move D under B) ---');
      const circRes = await fetch(`${BASE_FOLDER_URL}/${folderDId}/move`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetParentId: folderBId }),
      });
      const circData = await circRes.json();
      console.log('Status:', circRes.status);
      console.log('Response:', JSON.stringify(circData));
      if (circRes.status !== 400) {
        throw new Error('Circular move should have been prevented');
      }

      // 12. Add a test file inside Folder C to test cascade soft-delete
      console.log('\n--- Creating test file inside Folder C ---');
      const fileId = new mongoose.Types.ObjectId();
      await db.collection('files').insertOne({
        _id: fileId,
        owner: new mongoose.Types.ObjectId(userId),
        folderId: new mongoose.Types.ObjectId(folderCId),
        fileName: 'testfile.txt',
        originalName: 'testfile.txt',
        size: 100,
        storagePath: '/uploads/testfile.txt',
        isDeleted: false,
      });

      // 13. Soft Delete Folder B
      console.log('\n--- Test 13: Soft Delete Folder B ---');
      const deleteRes = await fetch(`${BASE_FOLDER_URL}/${folderBId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const deleteData = await deleteRes.json();
      console.log('Status:', deleteRes.status);
      console.log('Response:', JSON.stringify(deleteData));
      if (deleteRes.status !== 200) {
        throw new Error('Soft delete Folder B failed');
      }

      // Verify that Folder B, Folder C, and the file are marked as deleted
      const fBDel = await db.collection('folders').findOne({ _id: new mongoose.Types.ObjectId(folderBId) });
      const fCDel = await db.collection('folders').findOne({ _id: new mongoose.Types.ObjectId(folderCId) });
      const fileDel = await db.collection('files').findOne({ _id: fileId });

      console.log('Folder B isDeleted:', fBDel.isDeleted);
      console.log('Folder C isDeleted:', fCDel.isDeleted);
      console.log('File isDeleted:', fileDel.isDeleted);

      if (!fBDel.isDeleted || !fCDel.isDeleted || !fileDel.isDeleted) {
        throw new Error('Soft delete cascading failed');
      }

      // 14. Restore Folder B
      console.log('\n--- Test 14: Restore Folder B ---');
      const restoreRes = await fetch(`${BASE_FOLDER_URL}/${folderBId}/restore`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const restoreData = await restoreRes.json();
      console.log('Status:', restoreRes.status);
      console.log('Response:', JSON.stringify(restoreData));
      if (restoreRes.status !== 200) {
        throw new Error('Restore Folder B failed');
      }

      // Verify that Folder B, Folder C, and the file are restored
      const fBRes = await db.collection('folders').findOne({ _id: new mongoose.Types.ObjectId(folderBId) });
      const fCRes = await db.collection('folders').findOne({ _id: new mongoose.Types.ObjectId(folderCId) });
      const fileRes = await db.collection('files').findOne({ _id: fileId });

      console.log('Folder B restored isDeleted:', fBRes.isDeleted);
      console.log('Folder C restored isDeleted:', fCRes.isDeleted);
      console.log('File restored isDeleted:', fileRes.isDeleted);

      if (fBRes.isDeleted || fCRes.isDeleted || fileRes.isDeleted) {
        throw new Error('Restore cascading failed');
      }

      console.log('\n=========================================');
      console.log('ALL FOLDER MANAGEMENT TESTS PASSED SUCCESSFULLY! ✅');
      console.log('=========================================');

    } catch (err) {
      console.error('\n❌ Test failed with error:', err.message);
      console.error(err.stack);
      success = false;
    } finally {
      console.log('\nCleaning up database records...');
      try {
        await db.collection('users').deleteOne({ email: testUser.email });
        if (userId) {
          await db.collection('folders').deleteMany({ owner: new mongoose.Types.ObjectId(userId) });
          await db.collection('files').deleteMany({ owner: new mongoose.Types.ObjectId(userId) });
        }
      } catch (cleanupErr) {
        console.error('Failed to clean up records:', cleanupErr.message);
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
