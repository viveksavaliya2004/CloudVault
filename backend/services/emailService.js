/**
 * Email Service
 * Handles sending emails (e.g. OTPs for password reset).
 * Currently logs to console for local development testing.
 */

const sendPasswordResetOtp = async (email, otp) => {
  console.log('\n==================================================');
  console.log(`[EMAIL SERVICE] Password Reset Request for: ${email}`);
  console.log(`[EMAIL SERVICE] YOUR 6-DIGIT OTP IS: ${otp}`);
  console.log(`[EMAIL SERVICE] This OTP will expire in 10 minutes.`);
  console.log('==================================================\n');

  return true;
};

module.exports = {
  sendPasswordResetOtp,
};
