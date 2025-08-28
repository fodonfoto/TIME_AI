-- Development Test Data for OTP System
-- Insert fixed OTP for development testing

-- Insert development test OTP (111111 with ref code DEV001)
INSERT INTO otp_verifications (
    email,
    otp_code,
    ref_code,
    expires_at,
    attempts,
    is_verified
) VALUES (
    'test@timeai.dev',
    '111111',
    'DEV001',
    NOW() + INTERVAL '1 year', -- Never expires in dev
    0,
    FALSE
) ON CONFLICT (ref_code) DO UPDATE SET
    otp_code = EXCLUDED.otp_code,
    expires_at = EXCLUDED.expires_at,
    attempts = 0,
    is_verified = FALSE,
    updated_at = NOW();