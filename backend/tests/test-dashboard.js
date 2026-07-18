require('dotenv').config();
const app = require('../app');
const mongoose = require('mongoose');
const File = require('../models/File');
const Folder = require('../models/Folder');

const PORT = 5005;
const BASE_AUTH_URL = `http://localhost:${PORT}/api/auth`;
const BASE_STATS_URL = `http://localhost:${PORT}/api/files/list/dashboard-stats`;

const testUser = {
  name: 'Dashboard Test User',
  email: 'dashboardtest@example.com',
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

  const db = mongoose.connection;
  // Clean up existing test records
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
      console.log('Registered User ID:', userId);

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

      // Clean up any files left from previous tests under this user ID just in case
      await File.deleteMany({ owner: userId });
      await Folder.deleteMany({ owner: userId });

      // 3. Seed Mock Folder and File Data in MongoDB
      console.log('\n--- Test 3: Seeding Mock Folder & File Data ---');
      
      // Active Folders
      const folder1 = await Folder.create({
        name: 'Work Folders',
        owner: userId,
        isDeleted: false,
      });

      // Deleted Folders (Trash)
      const folderTrash = await Folder.create({
        name: 'Deleted Folders',
        owner: userId,
        isDeleted: true,
      });

      // Active Files
      const fileActiveImage = await File.create({
        fileName: 'dashboard-photo.png',
        originalName: 'dashboard-photo.png',
        size: 150000,
        mimeType: 'image/png',
        extension: '.png',
        storagePath: '/uploads/dashboard-photo.png',
        owner: userId,
        isDeleted: false,
        isStarred: false,
        isFavourite: false,
      });

      const fileActiveDocFav = await File.create({
        fileName: 'specifications.pdf',
        originalName: 'specifications.pdf',
        size: 450000,
        mimeType: 'application/pdf',
        extension: '.pdf',
        storagePath: '/uploads/specifications.pdf',
        owner: userId,
        isDeleted: false,
        isStarred: true,
        isFavourite: true,
      });

      // Soft Deleted Files (Trash)
      const fileDeletedZip = await File.create({
        fileName: 'old-backup.zip',
        originalName: 'old-backup.zip',
        size: 800000,
        mimeType: 'application/zip',
        extension: '.zip',
        storagePath: '/uploads/old-backup.zip',
        owner: userId,
        isDeleted: true,
        isStarred: false,
        isFavourite: false,
      });

      console.log('Successfully seeded test folders and files.');

      // 4. Hit dashboard-stats endpoint
      console.log('\n--- Test 4: Fetch Dashboard Stats ---');
      const statsRes = await fetch(BASE_STATS_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      const statsData = await statsRes.json();
      console.log('Status:', statsRes.status);
      console.log('Response:', JSON.stringify(statsData, null, 2));

      if (statsRes.status !== 200) {
        throw new Error(`Failed to fetch dashboard stats API, status: ${statsRes.status}`);
      }

      // Assertions
      console.log('\n--- Assertions ---');
      const result = statsData.data;

      // Storage Assertions
      // Active storage used is dashboard-photo.png (150,000) + specifications.pdf (450,000) = 600,000 bytes
      console.log(`Checking storageUsed. Expected: 600000, Got: ${result.storageUsed}`);
      if (result.storageUsed !== 600000) {
        throw new Error(`Incorrect storageUsed. Expected 600000, got ${result.storageUsed}`);
      }

      // Active File Count Assertions
      console.log(`Checking counts.files. Expected: 2, Got: ${result.counts.files}`);
      if (result.counts.files !== 2) {
        throw new Error(`Incorrect files count. Expected 2, got ${result.counts.files}`);
      }

      // Active Folder Count Assertions
      console.log(`Checking counts.folders. Expected: 1, Got: ${result.counts.folders}`);
      if (result.counts.folders !== 1) {
        throw new Error(`Incorrect folders count. Expected 1, got ${result.counts.folders}`);
      }

      // Recycle Bin Assertions
      console.log(`Checking recycleBin.filesCount. Expected: 1, Got: ${result.recycleBin.filesCount}`);
      if (result.recycleBin.filesCount !== 1) {
        throw new Error(`Incorrect trash files count. Expected 1, got ${result.recycleBin.filesCount}`);
      }

      console.log(`Checking recycleBin.foldersCount. Expected: 1, Got: ${result.recycleBin.foldersCount}`);
      if (result.recycleBin.foldersCount !== 1) {
        throw new Error(`Incorrect trash folders count. Expected 1, got ${result.recycleBin.foldersCount}`);
      }

      console.log(`Checking recycleBin.totalSize. Expected: 800000, Got: ${result.recycleBin.totalSize}`);
      if (result.recycleBin.totalSize !== 800000) {
        throw new Error(`Incorrect trash size. Expected 800000, got ${result.recycleBin.totalSize}`);
      }

      // Favorite Files Assertions
      console.log(`Checking favouriteFiles length. Expected: 1, Got: ${result.favouriteFiles.length}`);
      if (result.favouriteFiles.length !== 1 || result.favouriteFiles[0].fileName !== 'specifications.pdf') {
        throw new Error('Incorrect favouriteFiles content.');
      }

      // Pinned/Starred Files Assertions
      console.log(`Checking pinnedFiles length. Expected: 1, Got: ${result.pinnedFiles.length}`);
      if (result.pinnedFiles.length !== 1 || result.pinnedFiles[0].fileName !== 'specifications.pdf') {
        throw new Error('Incorrect pinnedFiles content.');
      }

      // Recent Uploads Assertions
      console.log(`Checking recentUploads length. Expected: 2, Got: ${result.recentUploads.length}`);
      if (result.recentUploads.length !== 2) {
        throw new Error(`Incorrect recentUploads count. Expected 2, got ${result.recentUploads.length}`);
      }

      console.log('\n=========================================');
      console.log('ALL DASHBOARD BACKEND API TESTS PASSED! ✅');
      console.log('=========================================');

    } catch (error) {
      console.error('\n❌ Test failed with error:', error.stack || error.message);
      success = false;
    } finally {
      console.log('\nCleaning up test records...');
      if (userId) {
        await File.deleteMany({ owner: userId });
        await Folder.deleteMany({ owner: userId });
        await db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
      }
      
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
