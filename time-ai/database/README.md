# OTP Database Setup Guide

## Overview
This system uses Supabase PostgreSQL database for OTP verification with proper production practices.

## Database Schema
- **Table**: `otp_verifications`
- **Features**: 
  - UUID primary keys
  - Email-based OTP storage
  - Reference code generation
  - Expiration handling
  - Attempt tracking
  - Auto-cleanup of expired records

## Setup Instructions

### 1. Run Database Schema
Execute `otp_schema.sql` in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of otp_schema.sql
```

### 2. Insert Development Test Data
Execute `dev_test_data.sql` for development testing:
```sql
-- Copy and paste the contents of dev_test_data.sql
```

### 3. Environment Variables
Add to your `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Development Mode
- **OTP Code**: `111111` (fixed for testing)
- **Ref Code**: `DEV001` (fixed for testing)
- **Email**: Any valid email format
- **Expiration**: 1 year (never expires in dev)

## Production Mode
- **OTP Code**: 6-digit random number
- **Ref Code**: 8-character alphanumeric (A-Z, 0-9)
- **Expiration**: 5 minutes
- **Rate Limiting**: 1 minute between requests
- **Attempt Limit**: 3 attempts per OTP

## API Endpoints
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/get-otp-ref` - Get reference code for existing OTP

## Database Functions
- `generate_ref_code()` - Generates 8-character reference codes
- `cleanup_expired_otps()` - Removes expired and verified OTPs
- Auto-update triggers for `updated_at` timestamps

## Security Features
- Row Level Security (RLS) enabled
- Service role access only
- Input validation and sanitization
- Rate limiting protection
- Automatic cleanup of sensitive data