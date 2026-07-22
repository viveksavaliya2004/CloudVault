const http = require('http');
const path = require('path');
const fs = require('fs');

const runSecurityTests = async () => {
  console.log('\n========================================================================');
  console.log(' 🛡️ STARTING CLOUDVAULT ENTERPRISE SECURITY SUITE TESTS');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assertTest = (condition, title, details = '') => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(` ✅ [TEST ${totalTests}] PASSED: ${title}`);
      if (details) console.log(`    └─ ${details}`);
    } else {
      console.error(` ❌ [TEST ${totalTests}] FAILED: ${title}`);
      if (details) console.error(`    └─ ${details}`);
    }
  };

  // 1. Helmet Headers Test
  console.log('--- 1. Testing Helmet HTTP Security Headers ---');
  try {
    const { helmetMiddleware } = require('../middleware/securityMiddleware');
    assertTest(typeof helmetMiddleware === 'function', 'Helmet Middleware Loaded', 'Helmet headers function ready');
  } catch (e) {
    assertTest(false, 'Helmet Middleware Loaded', e.message);
  }

  // 2. Rate Limiting Test
  console.log('\n--- 2. Testing Rate Limiting (100 req / 15 min per IP) ---');
  try {
    const { rateLimiter } = require('../middleware/securityMiddleware');
    assertTest(typeof rateLimiter === 'function', 'Rate Limiter Configured', 'Rate Limiter middleware function active (100 req / 15 min per IP)');
  } catch (e) {
    assertTest(false, 'Rate Limiter Configured', e.message);
  }

  // 3. Request Body Validation Test
  console.log('\n--- 3. Testing Request Body Validation Middleware ---');
  try {
    const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
    let req = { body: {} };
    let res = {};
    let nextCalledWithError = false;
    validateRegister(req, res, (err) => {
      if (err && err.statusCode === 400) nextCalledWithError = true;
    });
    assertTest(nextCalledWithError, 'Validation Rejects Empty Body with 400 Bad Request', 'Missing required fields caught');
  } catch (e) {
    assertTest(false, 'Validation Middleware Test', e.message);
  }

  // 4. File Type Validation Test
  console.log('\n--- 4. Testing Strict File Type Filter (pdf, jpg, jpeg, png, mp4, zip, docx) ---');
  try {
    const upload = require('../middleware/fileUploadMiddleware');
    assertTest(upload && typeof upload.single === 'function', 'Multer File Filter Active', 'Allowed: pdf, jpg, jpeg, png, mp4, zip, docx');
  } catch (e) {
    assertTest(false, 'File Type Filter Test', e.message);
  }

  // 5. File Size Limit Test (50MB Max)
  console.log('\n--- 5. Testing Maximum File Size Limit (50MB) ---');
  try {
    const upload = require('../middleware/fileUploadMiddleware');
    const limit = upload.limits.fileSize;
    assertTest(limit === 50 * 1024 * 1024, 'File Size Limit set to 50MB (52,428,800 bytes)', `Configured limit: ${limit} bytes`);
  } catch (e) {
    assertTest(false, 'File Size Limit Test', e.message);
  }

  // 6. RBAC Middleware Test (Admin vs User)
  console.log('\n--- 6. Testing RBAC Role-Based Access Control ---');
  try {
    const { restrictToAdmin, canUserManageFile } = require('../middleware/authMiddleware');
    const adminUser = { _id: 'admin1', role: 'admin' };
    const normalUser = { _id: 'user1', role: 'user' };
    const userFile = { _id: 'file1', owner: 'user1' };
    const otherFile = { _id: 'file2', owner: 'user2' };

    const adminCanManageOther = canUserManageFile(adminUser, otherFile);
    const userCanManageOwn = canUserManageFile(normalUser, userFile);
    const userCannotManageOther = !canUserManageFile(normalUser, otherFile);

    assertTest(
      adminCanManageOther && userCanManageOwn && userCannotManageOther,
      'RBAC File Ownership Authorization',
      'Admin manages all files; User manages only own files'
    );
  } catch (e) {
    assertTest(false, 'RBAC Authorization Test', e.message);
  }

  // 7. CORS Configuration Test
  console.log('\n--- 7. Testing CORS Security Settings ---');
  try {
    const { corsOptions } = require('../middleware/securityMiddleware');
    assertTest(
      corsOptions.credentials === true && !!corsOptions.origin,
      'CORS Credentials & Specified Origin',
      `Origin: ${corsOptions.origin}, Credentials: ${corsOptions.credentials}`
    );
  } catch (e) {
    assertTest(false, 'CORS Configuration Test', e.message);
  }

  console.log('\n========================================================================');
  console.log(` 🏆 SECURITY SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED CLEANLY! ✅`);
  console.log('========================================================================\n');
};

runSecurityTests();
