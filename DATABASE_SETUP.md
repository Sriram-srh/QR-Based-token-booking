# Database Setup Guide

This document outlines the complete database setup for the Meal Token System with QR code generation and detection.

## Prerequisites

- Supabase project (free tier is sufficient)
- Node.js 18+
- pnpm package manager

## Environment Setup

1. **Create Supabase Project**
   - Go to https://supabase.com and create a new project
   - Save your project URL and keys

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Database Initialization

The database setup is automated through SQL migration scripts located in `/scripts`:

### Step 1: Run Schema Migration
```bash
# This creates all tables with proper relationships and constraints
npm run db:init
# Or manually:
# Execute scripts/01-init-database.sql in Supabase SQL Editor
```

### Step 2: Seed Sample Data
```bash
npm run db:seed
# Or manually:
# Execute scripts/02-seed-data.sql in Supabase SQL Editor
```

### Step 3: Configure Row Level Security (RLS)
```bash
# Execute scripts/00-rls-policies.sql for production
# This is optional for development but recommended
```

## Database Schema

### Users Table
- `id`: UUID (primary key)
- `email`: VARCHAR UNIQUE
- `password_hash`: VARCHAR
- `name`: VARCHAR
- `user_type`: ENUM ('student', 'staff', 'admin')
- `created_at`, `updated_at`: TIMESTAMPS

### Students Table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `roll_number`: VARCHAR UNIQUE
- `batch_year`: INTEGER
- `hostel_name`: VARCHAR
- `phone`: VARCHAR
- `balance`: DECIMAL (meal token balance)

### Staff Table
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `employee_id`: VARCHAR UNIQUE
- `department`: VARCHAR
- `is_counter_manager`: BOOLEAN

### Meals Table
- `id`: UUID (primary key)
- `name`: VARCHAR
- `description`: TEXT
- `meal_type`: ENUM ('Breakfast', 'Lunch', 'Dinner')
- `meal_date`: DATE
- `available_count`: INTEGER

### Meal Items Table
- `id`: UUID (primary key)
- `meal_id`: UUID (foreign key to meals)
- `item_name`: VARCHAR
- `price`: DECIMAL
- `calories`: INTEGER

### Meal Tokens Table
- `id`: UUID (primary key)
- `student_id`: UUID (foreign key to students)
- `meal_type`: VARCHAR
- `status`: ENUM ('VALID', 'USED', 'EXPIRED', 'CANCELLED')
- `qr_code`: TEXT UNIQUE
- `qr_code_image`: TEXT (base64 encoded)
- `total_cost`: DECIMAL
- `expires_at`: TIMESTAMP
- `scanned_at`: TIMESTAMP (null until scanned)
- `counter_id`: UUID (null until verified)

### Counters Table
- `id`: UUID (primary key)
- `name`: VARCHAR UNIQUE
- `location`: VARCHAR
- `meal_type`: VARCHAR
- `is_active`: BOOLEAN

### Audit Logs Table
- `id`: UUID (primary key)
- `action`: VARCHAR
- `user_id`: UUID
- `details`: JSONB
- `created_at`: TIMESTAMP

## QR Code System

### Generation
- QR codes are generated when a token is created
- Format: `TOKEN:{timestamp}:{studentId}:{mealType}`
- Stored both as text and base64 image in database
- Images can be displayed in UI or printed

### Detection/Scanning
- Uses `jsqr` library for real-time QR detection from camera
- Validates QR code format
- Verifies token exists and is valid
- Updates token status to "USED"
- Records scanning details in audit logs

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
  - Body: `{ email, password, userType }`
  - Returns: User object with details

### Tokens
- `GET /api/tokens?studentId={id}` - Get student's tokens
- `POST /api/tokens` - Create new token
  - Body: `{ studentId, mealType, totalCost }`
  - Returns: Created token with QR code

### QR Code
- `POST /api/qr/generate` - Generate QR code
  - Body: `{ data }`
  - Returns: QR code image
- `POST /api/qr/scan` - Process scanned QR
  - Body: `{ qrCode }`
  - Returns: Decoded QR data

### Verification
- `POST /api/verify` - Verify and scan token
  - Body: `{ qrCode, counterId }`
  - Returns: Verification result with student/token info

## Testing

### Test Credentials
The seeded database includes:

**Students:**
- Email: `student1@example.com` / Password: `password123`
- Email: `student2@example.com` / Password: `password123`

**Staff:**
- Email: `staff1@example.com` / Password: `password123`
- Email: `staff2@example.com` / Password: `password123`

**Admin:**
- Email: `admin@example.com` / Password: `password123`

### Manual Testing Steps

1. **Create a Token**
   ```bash
   # Login as student
   # Navigate to "Book Token" section
   # Select meal type and proceed to book
   ```

2. **View QR Code**
   ```bash
   # Check "My Tokens" section
   # QR code displays in token details
   # Can be scanned with any QR scanner
   ```

3. **Scan Token**
   ```bash
   # Login as staff
   # Navigate to verification screen
   # Allow camera access
   # Point camera at QR code
   # Token should be marked as USED
   ```

## Troubleshooting

### Database Connection Issues
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase project is active
- Ensure API calls use correct URL

### QR Generation Issues
- Verify `qrcode` and `qrcode.react` packages are installed
- Check QR data doesn't exceed 2953 bytes (QR limit)
- Ensure proper encoding

### QR Scanner Issues
- Camera permissions must be granted
- Only works in HTTPS or localhost
- `jsqr` requires good lighting conditions
- Test with a generated QR code first

### Token Expiration
- Tokens expire 7 days after creation
- Expired tokens show as "EXPIRED" status
- Cannot use expired tokens for meals

## Production Checklist

- [ ] Enable Row Level Security (RLS) in Supabase
- [ ] Set up proper authentication flow
- [ ] Configure CORS if frontend is on different domain
- [ ] Set up automated backups
- [ ] Enable SSL/TLS for all connections
- [ ] Configure proper API rate limiting
- [ ] Set up monitoring for failed verifications
- [ ] Test with real QR scanners/cameras
- [ ] Implement proper error handling in UI
- [ ] Add email notifications for token expiry

## Performance Optimization

- Create indexes on frequently queried columns:
  ```sql
  CREATE INDEX idx_tokens_student ON meal_tokens(student_id);
  CREATE INDEX idx_tokens_status ON meal_tokens(status);
  CREATE INDEX idx_audit_user ON audit_logs(user_id);
  ```

- Use prepared statements for all queries
- Implement caching for meal data
- Batch QR generation for multiple tokens

## Support

For issues or questions:
1. Check the error logs in Supabase
2. Review the audit logs table
3. Verify all environment variables are set
4. Check browser console for frontend errors
