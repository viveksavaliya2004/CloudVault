const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const folderRoutes = require('../routes/folderRoutes');
const fileRoutes = require('../routes/fileRoutes');
const cacheService = require('../services/cacheService');
const User = require('../models/User');
const Folder = require('../models/Folder');
const File = require('../models/File');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);

const PORT = 5009;
let server;

async function runAllCacheVerifications() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.\n');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Verification Server Running on Port ${PORT}\n`);

    const baseUrl = `http://localhost:${PORT}/api`;
    const testEmail = `all_cache_verify_${Date.now()}@example.com`;

    // Register & Login
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cache Master', email: testEmail, password: 'password123' })
    });
    const regData = await regRes.json();
    const userId = regData.data.user._id;

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;

    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('========================================================================');
    console.log(' 1. PROFILE CACHE VERIFICATION');
    console.log('========================================================================');
    // Step A: Read Profile (Populates Cache)
    const p1 = await fetch(`${baseUrl}/users/profile`, { headers: authHeaders });
    const p1Data = await p1.json();
    console.log(`[1.1] Initial Profile Loaded: Name = "${p1Data.data.user.name}"`);

    const cachedProfile1 = await cacheService.getProfile(userId);
    console.log(`[1.2] Cache State: [CACHE HIT ✅] Name in Cache = "${cachedProfile1?.name}"`);

    // Step B: Update Profile (Triggers Cache Invalidation)
    await fetch(`${baseUrl}/users/profile`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Cache Master Updated' })
    });
    console.log(`[1.3] Action: Updated Name to "Cache Master Updated"`);

    const cachedProfileAfterUpdate = await cacheService.getProfile(userId);
    console.log(`[1.4] Post-Update Cache State: ${cachedProfileAfterUpdate === null ? '[CACHE INVALIDATED ✅] Stale Profile Purged!' : '[FAIL] Stale Profile Still In Cache'}`);

    // Step C: Re-fetch Profile (Populates Cache with Fresh Data)
    const p2 = await fetch(`${baseUrl}/users/profile`, { headers: authHeaders });
    const p2Data = await p2.json();
    console.log(`[1.5] Re-fetched Profile: Name = "${p2Data.data.user.name}"`);

    const cachedProfile2 = await cacheService.getProfile(userId);
    console.log(`[1.6] Cache State: [CACHE REPOPULATED ✅] Name in Cache = "${cachedProfile2?.name}"\n`);


    console.log('========================================================================');
    console.log(' 2. FOLDER TREE CACHE VERIFICATION');
    console.log('========================================================================');
    // Step A: Fetch All Folders (Populates Folder Tree Cache)
    const f1 = await fetch(`${baseUrl}/folders`, { headers: authHeaders });
    const f1Data = await f1.json();
    console.log(`[2.1] Initial Folders Loaded: Count = ${f1Data.data.folders.length}`);

    const cachedFolders1 = await cacheService.getFolderTree(userId);
    console.log(`[2.2] Cache State: [CACHE HIT ✅] Folders in Cache = ${cachedFolders1?.length}`);

    // Step B: Create a Folder (Triggers Folder Tree Invalidation)
    const createFolderRes = await fetch(`${baseUrl}/folders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'New Cache Folder' })
    });
    const newFolderData = await createFolderRes.json();
    console.log(`[2.3] Action: Created Folder "${newFolderData.data.folder.name}"`);

    const cachedFoldersAfterCreate = await cacheService.getFolderTree(userId);
    console.log(`[2.4] Post-Creation Cache State: ${cachedFoldersAfterCreate === null ? '[CACHE INVALIDATED ✅] Stale Folder Tree Purged!' : '[FAIL] Stale Folder Tree Still In Cache'}`);

    // Step C: Re-fetch Folders (Populates Cache with Fresh Folder Count)
    const f2 = await fetch(`${baseUrl}/folders`, { headers: authHeaders });
    const f2Data = await f2.json();
    console.log(`[2.5] Re-fetched Folders: Count = ${f2Data.data.folders.length}`);

    const cachedFolders2 = await cacheService.getFolderTree(userId);
    console.log(`[2.6] Cache State: [CACHE REPOPULATED ✅] Folders in Cache = ${cachedFolders2?.length}\n`);


    console.log('========================================================================');
    console.log(' 3. STORAGE USAGE CACHE VERIFICATION');
    console.log('========================================================================');
    // Step A: Fetch Stats (Populates Storage Usage Cache)
    const s1 = await fetch(`${baseUrl}/files/list/dashboard-stats`, { headers: authHeaders });
    const s1Data = await s1.json();
    console.log(`[3.1] Initial Storage Loaded: Used = ${s1Data.data.storageUsed} bytes`);

    const cachedStorage1 = await cacheService.getStorageUsage(userId);
    console.log(`[3.2] Cache State: [CACHE HIT ✅] Storage Used in Cache = ${cachedStorage1?.storageUsed} bytes`);

    // Step B: Create a File & Update Storage (Triggers Storage Usage Invalidation)
    await File.create({
      owner: userId,
      fileName: 'storage-demo.pdf',
      originalName: 'storage-demo.pdf',
      size: 512000, // 500 KB
      mimeType: 'application/pdf',
      extension: '.pdf',
      storagePath: '/uploads/storage-demo.pdf'
    });
    await User.findByIdAndUpdate(userId, { storageUsed: 512000 });
    await cacheService.invalidateStorageUsage(userId);
    console.log(`[3.3] Action: Added 500 KB File & Updated User Storage Used to 512,000 bytes`);

    const cachedStorageAfterUpdate = await cacheService.getStorageUsage(userId);
    console.log(`[3.4] Post-Mutation Cache State: ${cachedStorageAfterUpdate === null ? '[CACHE INVALIDATED ✅] Stale Storage Data Purged!' : '[FAIL] Stale Storage Data Still In Cache'}`);

    // Step C: Re-fetch Stats (Populates Cache with Fresh Storage Usage)
    const s2 = await fetch(`${baseUrl}/files/list/dashboard-stats`, { headers: authHeaders });
    const s2Data = await s2.json();
    console.log(`[3.5] Re-fetched Storage: Used = ${s2Data.data.storageUsed} bytes`);

    const cachedStorage2 = await cacheService.getStorageUsage(userId);
    console.log(`[3.6] Cache State: [CACHE REPOPULATED ✅] Storage Used in Cache = ${cachedStorage2?.storageUsed} bytes\n`);

    console.log('========================================================================');
    console.log(' ALL 3 CACHE VERIFICATIONS (PROFILE, FOLDER TREE, STORAGE) PASSED! ✅');
    console.log('========================================================================\n');

    // Clean up
    await User.deleteOne({ _id: userId });
    await Folder.deleteMany({ owner: userId });
    await File.deleteMany({ owner: userId });
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runAllCacheVerifications();
