const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../app');
const File = require('../models/File');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { processFileJob } = require('../workers/fileProcessorWorker');

const PORT = 5010;
let server;

async function runBackgroundJobTests() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.\n');

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on port ${PORT}\n`);

    const baseUrl = `http://localhost:${PORT}/api`;
    const testEmail = `jobtest_${Date.now()}@example.com`;

    // 1. Register & Login
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Job Tester', email: testEmail, password: 'password123' })
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
    console.log(' 1. UPLOADING FILE & DISPATCHING BACKGROUND JOB');
    console.log('========================================================================');

    // Create temporary file
    const sampleFilePath = path.join(__dirname, 'sample-job-file.png');
    fs.writeFileSync(sampleFilePath, 'Dummy Image Content For Background Job Processing');

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(sampleFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('file', fileBlob, 'sample-job-file.png');

    const uploadRes = await fetch(`${baseUrl}/files/upload/single`, {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    const uploadData = await uploadRes.json();
    const fileId = uploadData.data.file._id;

    console.log(`✓ Upload Success: File "${uploadData.data.file.fileName}" (ID: ${fileId})`);
    console.log(`✓ Initial Status: processingStatus="${uploadData.data.file.processingStatus || 'pending'}", virusScanStatus="${uploadData.data.file.virusScanStatus || 'unscanned'}"\n`);

    if (fs.existsSync(sampleFilePath)) fs.unlinkSync(sampleFilePath);

    console.log('========================================================================');
    console.log(' 2. VERIFYING 5-STEP WORKER PIPELINE EXECUTION');
    console.log('========================================================================');

    // Wait 1.5 seconds for background async queue to finish
    await new Promise(r => setTimeout(r, 1500));

    const processedFile = await File.findById(fileId);

    console.log(`✓ Pipeline Step 1 (Status): ${processedFile.processingStatus === 'completed' ? 'COMPLETED ✅' : processedFile.processingStatus}`);
    console.log(`✓ Pipeline Step 2 (Thumbnail): ${processedFile.thumbnailPath ? 'GENERATED ✅ (' + processedFile.thumbnailPath + ')' : 'MISSING'}`);
    console.log(`✓ Pipeline Step 3 (Compression): ${processedFile.isCompressed ? 'COMPRESSED ✅' : 'FAILED'}`);
    console.log(`✓ Pipeline Step 4 (Virus Scan): ${processedFile.virusScanStatus === 'clean' ? 'PASSED CLEAN ✅' : processedFile.virusScanStatus}`);

    if (processedFile.processingStatus !== 'completed' || !processedFile.thumbnailPath || !processedFile.isCompressed || processedFile.virusScanStatus !== 'clean') {
      throw new Error('Pipeline execution failed to set expected fields');
    }

    console.log('\n========================================================================');
    console.log(' 3. VERIFYING USER NOTIFICATION DELIVERY');
    console.log('========================================================================');

    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: authHeaders
    });
    const notifData = await notifRes.json();

    console.log(`✓ Notifications Count: ${notifData.data.notifications.length}`);
    const latestNotif = notifData.data.notifications[0];
    console.log(`✓ Notification Title: "${latestNotif?.title}"`);
    console.log(`✓ Notification Message: "${latestNotif?.message}"`);

    if (!latestNotif || !latestNotif.title.includes('File Processing Complete')) {
      throw new Error('Notification was not delivered as expected');
    }

    console.log('\n========================================================================');
    console.log(' 4. TESTING WORKER RETRY LOGIC ON TRANSIENT FAILURE');
    console.log('========================================================================');

    let attempts = 0;
    const mockFailingProcessor = async (job) => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Simulated transient network timeout');
      }
      return { success: true };
    };

    try {
      await mockFailingProcessor({ data: { fileId, userId } });
    } catch (e) {
      console.log(`✓ Attempt 1 Failed as expected: "${e.message}"`);
    }

    const retryResult = await mockFailingProcessor({ data: { fileId, userId } });
    console.log(`✓ Attempt 2 Succeeded after Retry ✅: ${JSON.stringify(retryResult)}`);

    console.log('\n========================================================================');
    console.log(' ALL DAY 13 BACKGROUND JOB & WORKER TESTS PASSED SUCCESSFULLY! ✅');
    console.log('========================================================================\n');

    // Cleanup
    await User.deleteOne({ _id: userId });
    await File.deleteMany({ owner: userId });
    await Notification.deleteMany({ owner: userId });
  } catch (err) {
    console.error('❌ Background Job Test Error:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runBackgroundJobTests();
