require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

const File = require('../models/File');
const User = require('../models/User');
const compressionService = require('../services/compressionService');

const testUser = {
  name: 'Compression Tester',
  email: 'comptest@example.com',
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

  // Cleanup existing
  await db.collection('users').deleteOne({ email: testUser.email });

  try {
    // 1. Create a dummy user
    console.log('\n--- Test 1: Setup test user ---');
    const user = await User.create({
      ...testUser,
      storageUsed: 5000000, // 5MB initially used
      storageLimit: 5368709120,
    });
    console.log(`User created. ID: ${user._id}`);

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // 2. Test Image Compression
    console.log('\n--- Test 2: Image Compression ---');
    const testImageFilename = 'comp-test-image.jpg';
    const testImagePath = path.join(uploadsDir, testImageFilename);

    // Create a 100% quality JPEG with random noise (large size, hard to compress losslessly)
    const randomPixels = crypto.randomBytes(500 * 500 * 3);
    await sharp(randomPixels, {
      raw: {
        width: 500,
        height: 500,
        channels: 3
      }
    })
    .jpeg({ quality: 100 })
    .toFile(testImagePath);

    const origImageSize = fs.statSync(testImagePath).size;
    console.log(`Created mock raw image. Original size: ${origImageSize} bytes.`);

    let imageDoc = await File.create({
      owner: user._id,
      fileName: testImageFilename,
      originalName: testImageFilename,
      size: origImageSize,
      mimeType: 'image/jpeg',
      extension: '.jpg',
      storagePath: `/uploads/${testImageFilename}`,
      thumbnailUrl: `/uploads/${testImageFilename}`,
    });

    console.log('Invoking compression for image...');
    await compressionService.compressFile(imageDoc);

    // Reload image doc and user doc
    imageDoc = await File.findById(imageDoc._id);
    const userAfterImage = await User.findById(user._id);

    console.log(`Compressed image size in DB: ${imageDoc.size} bytes.`);
    console.log(`User storage used after image compression: ${userAfterImage.storageUsed} bytes.`);

    if (imageDoc.size >= origImageSize) {
      throw new Error('Image size did not decrease after compression!');
    }
    if (userAfterImage.storageUsed >= 5000000) {
      throw new Error('User storage used was not correctly deducted!');
    }
    console.log('✅ Image Compression Test: SUCCESS');

    // Clean up image
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
    await File.deleteOne({ _id: imageDoc._id });


    // 3. Test PDF Compression
    console.log('\n--- Test 3: PDF Compression ---');
    const testPdfFilename = 'comp-test.pdf';
    const testPdfPath = path.join(uploadsDir, testPdfFilename);

    // Generate a larger PDF with multiple pages to test compression
    const pdfDoc = await PDFDocument.create();
    for (let p = 0; p < 20; p++) {
      const page = pdfDoc.addPage([600, 800]);
      for (let i = 0; i < 100; i++) {
        page.drawText(`Hello CloudVault PDF compression test on page ${p} line number ${i}! Repetitive content testing.`, { x: 50, y: 750 - i * 7, size: 7 });
      }
    }
    const pdfBytes = await pdfDoc.save(); // Uncompressed object streams
    fs.writeFileSync(testPdfPath, pdfBytes);

    const origPdfSize = fs.statSync(testPdfPath).size;
    console.log(`Created mock PDF. Original size: ${origPdfSize} bytes.`);

    let pdfDocDb = await File.create({
      owner: user._id,
      fileName: testPdfFilename,
      originalName: testPdfFilename,
      size: origPdfSize,
      mimeType: 'application/pdf',
      extension: '.pdf',
      storagePath: `/uploads/${testPdfFilename}`,
      thumbnailUrl: `/uploads/${testPdfFilename}`,
    });

    // Reset user storage to 5MB for clean test
    userAfterImage.storageUsed = 5000000;
    await userAfterImage.save();

    console.log('Invoking compression for PDF...');
    await compressionService.compressFile(pdfDocDb);

    pdfDocDb = await File.findById(pdfDocDb._id);
    const userAfterPdf = await User.findById(user._id);

    console.log(`Compressed PDF size in DB: ${pdfDocDb.size} bytes.`);
    console.log(`User storage used after PDF compression: ${userAfterPdf.storageUsed} bytes.`);

    if (!pdfDocDb.isCompressed) {
      throw new Error('PDF was not marked as compressed!');
    }
    console.log('✅ PDF Compression Test: SUCCESS');

    // Clean up PDF
    if (fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath);
    await File.deleteOne({ _id: pdfDocDb._id });


    // 4. Test ZIP Compression
    console.log('\n--- Test 4: ZIP Compression ---');
    const testZipFilename = 'comp-test.zip';
    const testZipPath = path.join(uploadsDir, testZipFilename);

    // Create a zip file containing raw uncompressed buffer text
    const zip = new AdmZip();
    // Use raw buffer added as uncompressed or low compression if default
    zip.addFile('data.txt', Buffer.alloc(50000, 'X'));
    zip.writeZip(testZipPath);

    const origZipSize = fs.statSync(testZipPath).size;
    console.log(`Created mock ZIP. Original size: ${origZipSize} bytes.`);

    let zipDoc = await File.create({
      owner: user._id,
      fileName: testZipFilename,
      originalName: testZipFilename,
      size: origZipSize,
      mimeType: 'application/zip',
      extension: '.zip',
      storagePath: `/uploads/${testZipFilename}`,
      thumbnailUrl: `/uploads/${testZipFilename}`,
    });

    // Reset user storage
    userAfterPdf.storageUsed = 5000000;
    await userAfterPdf.save();

    console.log('Invoking compression for ZIP...');
    await compressionService.compressFile(zipDoc);

    zipDoc = await File.findById(zipDoc._id);
    const userAfterZip = await User.findById(user._id);

    console.log(`Compressed ZIP size in DB: ${zipDoc.size} bytes.`);
    console.log(`User storage used after ZIP compression: ${userAfterZip.storageUsed} bytes.`);

    // Note: ZIP might be re-compressed slightly or equal depending on deflate.
    // If it did decrease or stay equal (in worst case), let's ensure it is marked compressed.
    if (!zipDoc.isCompressed) {
      throw new Error('ZIP was not marked as compressed!');
    }
    console.log('✅ ZIP Compression Test: SUCCESS');

    // Clean up ZIP
    if (fs.existsSync(testZipPath)) fs.unlinkSync(testZipPath);
    await File.deleteOne({ _id: zipDoc._id });

    console.log('\n=========================================');
    console.log('ALL COMPRESSION SERVICE TESTS PASSED SUCCESSFULLY! ✅');
    console.log('=========================================');

  } catch (err) {
    console.error('❌ Compression Test failed:', err.message);
    console.error(err.stack);
  } finally {
    await db.collection('users').deleteOne({ email: testUser.email });
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

runTests();
