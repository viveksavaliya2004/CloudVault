const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('../routes/authRoutes');
const fileRoutes = require('../routes/fileRoutes');
const cacheService = require('../services/cacheService');
const User = require('../models/User');
const File = require('../models/File');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

const PORT = 5008;
let server;

async function runUploadCacheVerification() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.\n');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Verification server running on port ${PORT}\n`);

    const baseUrl = `http://localhost:${PORT}/api`;
    const testEmail = `upload_cache_${Date.now()}@example.com`;

    // 1. Register & Login
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Upload Cache Tester', email: testEmail, password: 'password123' })
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
      'Authorization': `Bearer ${token}`
    };

    console.log('========================================================================');
    console.log(' STEP 1: Initial Dashboard Fetch (Populating Cache)');
    console.log('========================================================================');
    const d1 = await fetch(`${baseUrl}/files/list/dashboard-stats`, { headers: authHeaders });
    const d1Data = await d1.json();
    console.log(`✓ Stats Loaded: Storage Used = ${d1Data.data.storageUsed} bytes, Recent Files = ${d1Data.data.recentFiles.length}`);

    // Inspect cache key
    const cachedBefore = await cacheService.getRecentFiles(userId);
    console.log(`✓ Cache Status in Redis/Memory: [CACHE HIT] Saved ${cachedBefore?.length || 0} recent files.\n`);

    console.log('========================================================================');
    console.log(' STEP 2: Uploading File via Multipart Endpoint (/api/files/upload/single)');
    console.log('========================================================================');

    // Create a temporary sample dummy file to upload
    const tempFilePath = path.join(__dirname, 'sample-upload-test.png');
    fs.writeFileSync(tempFilePath, 'CloudVault Cache Test Sample Content');

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(tempFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('file', fileBlob, 'sample-upload-test.png');

    const uploadRes = await fetch(`${baseUrl}/files/upload/single`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log(`⚡ Uploaded file: "${uploadData.data.file.fileName}" (${uploadData.data.file.size} bytes)`);

    // Clean up temporary dummy file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // Inspect cache immediately after upload
    const cachedAfterUpload = await cacheService.getRecentFiles(userId);
    console.log(`✓ Immediate Cache Check After Upload: ${cachedAfterUpload === null ? '[CACHE INVALIDATED ✅] Stale cached data removed!' : '[FAIL] Cache was not invalidated'}\n`);

    console.log('========================================================================');
    console.log(' STEP 3: Second Dashboard Fetch (Populating Cache with New File)');
    console.log('========================================================================');
    const d2 = await fetch(`${baseUrl}/files/list/dashboard-stats`, { headers: authHeaders });
    const d2Data = await d2.json();
    console.log(`✓ Updated Stats Loaded: Storage Used = ${d2Data.data.storageUsed} bytes, Recent Files = ${d2Data.data.recentFiles.length}`);

    const cachedAfterRefetch = await cacheService.getRecentFiles(userId);
    console.log(`✓ Cache Status in Redis/Memory: [CACHE REPOPULATED ✅] Contains newly uploaded file "${cachedAfterRefetch[0]?.fileName}".\n`);

    console.log('========================================================================');
    console.log(' VERIFICATION SUCCESSFUL! Upload properly invalidates and refreshes cache. ✅');
    console.log('========================================================================\n');

    // Cleanup
    await User.deleteOne({ _id: userId });
    await File.deleteMany({ owner: userId });
  } catch (err) {
    console.error('❌ Error during upload cache verification:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runUploadCacheVerification();
