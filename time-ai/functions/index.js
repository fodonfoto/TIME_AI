// Import modules at the top level to avoid lazy loading
const { sendOTP, verifyOTP } = require('./src/otpService');

// Export Firebase Functions
exports.sendOTP = sendOTP;
exports.verifyOTP = verifyOTP;