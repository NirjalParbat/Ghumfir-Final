# Ghumfir Tourism Management Platform

Final project submission for a full-stack MERN tourism platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Payments | Khalti simulation, Card simulation, Cash |

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies

From project root:

```bash
npm run install:all
```

### 2. Create environment files

Create server environment file from template and set values:

```bash
cp server/.env.example server/.env
```

Minimum required value in server/.env:

```env
MONGO_URI=<your_mongodb_connection_string>
```

Create client environment file:

```bash
echo VITE_API_URL=http://localhost:8080/api > client/.env
```

Optional for email notifications in server/.env:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=Ghumfir
```

### 3. Seed initial data (recommended)

```bash
npm run seed
```

### 4. Start the project

```bash
npm run dev
```

App URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

## Submission Notes

- This project is configured for local development and demonstration.
- Build output folders such as client/dist are generated files and are not required unless you explicitly run a build.

## Key Features

- User and admin authentication
- Tour package browsing and package management
- Booking workflow and booking history
- Review and rating system
- Admin dashboard modules
- Responsive UI
- Smart filtering with linear search and bubble sort algorithms
- Password reset via secure email tokens

## Forgot & Reset Password Flow

A secure token-based password reset system is implemented:

### 1. Request Password Reset

User logs out, clicks "Forgot Password?" on the login page, and enters their email.

**Request:**
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (always generic for security):**
```json
{
  "success": true,
  "message": "If an account with this email exists, a reset link has been sent."
}
```

**Backend actions:**
- Finds user by email (case-insensitive)
- Generates a raw 32-byte hex token via `crypto.randomBytes(32)`
- Hashes it using SHA256 and stores the hash in DB with 15-minute expiry
- Sends reset email containing the raw token (never stored raw in DB)

### 2. Reset Password

User receives email with reset link: `http://localhost:5173/reset-password/{rawToken}`

User opens the page, enters new password twice, and submits.

**Request:**
```bash
PUT /api/auth/reset-password
Content-Type: application/json

{
  "token": "a7f9c2e1d4b5a8f3c9e2d1b4a7f9c2e1d4b5a8f3c9e2d1b4a7f9c2e1d4b5",
  "newPassword": "NewSecure12345"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in."
}
```

**Response (failure - invalid/expired token):**
```json
{
  "success": false,
  "message": "Reset token is invalid or expired"
}
```

**Backend actions:**
- Hashes incoming token using the same SHA256 method
- Queries DB for user with matching hashed token AND valid (non-expired) resetPasswordExpire timestamp
- If found: bcrypt hashes new password with 10 salt rounds, clears token fields, saves to DB
- If not found: returns error (prevents timing-based account enumeration)

### Security Features

- **No user enumeration:** Forgot endpoint responds identically whether email exists or not
- **Raw token never stored:** Only SHA256 hash exists in DB
- **Single-use token:** Cleared immediately after successful reset
- **Time-limited:** 15-minute expiry window for each reset request
- **Bcrypt hashing:** New password hashed with 10 salt rounds before storage
- **Rate limiting:** Forgot/Reset endpoints apply login rate limiter (10 attempts per 15 min per IP)

### Test the Flow Locally

Since email is optional in development, you can manually test:

1. Restart backend to see console logs when email send is attempted
2. Check MongoDB directly to see hashed token and expiry timestamp
3. Use the test token in the reset endpoint request

Or configure SMTP in `server/.env` to receive real emails:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=Ghumfir
```

## Smart Filters Algorithm

The Tours page implements two key algorithms:

### Linear Search
Iterates through packages once, applying multiple filter conditions sequentially:
- Destination filter
- Activity category filter
- Duration range filter
- Rating threshold filter
- Price range filter
- Search text matching

### Bubble Sort
Nested-loop sorting for organizing results:
- **Sort by Price:** Ascending or descending
- **Sort by Duration:** Ascending or descending
- **Sort by Rating:** Descending
- **Sort by Created Date:** Newest or oldest first
