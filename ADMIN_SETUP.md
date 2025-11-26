# Admin Panel Setup Guide

## Overview

The admin panel allows administrators to:
- View all registered users
- See user statistics (total users, verified users, admins)
- Reset user passwords without requiring the current password
- Search and filter users by username or email

## Files Added

1. **admin.html** - Admin panel frontend page
2. **make-admin.js** - Script to promote users to admin
3. **ADMIN_SETUP.md** - This guide

## Files Modified

1. **auth.js** - Added admin functions:
   - `isUserAdmin(userId)` - Check if user is admin
   - `getAllUsers()` - Get all users (admin only)
   - `adminResetPassword(userId, newPassword)` - Reset password without current password
   - Added `is_admin` column to users table

2. **server.js** - Added admin API endpoints:
   - `GET /admin/users` - Get all users (requires admin token)
   - `POST /admin/reset-password/:userId` - Reset user password (requires admin token)

## Setup Instructions

### Step 1: Update Database Schema

The `is_admin` column will be automatically added to the users table when you restart your server. This happens in the `initUsersTable()` function in `auth.js`.

### Step 2: Promote Your First Admin

You need to promote at least one user to admin status. First, make sure you have a registered account:

1. Go to the account page and register if you haven't already
2. Run the make-admin script:

```bash
node make-admin.js YOUR_USERNAME
```

Example:
```bash
node make-admin.js codyw
```

You should see:
```
✅ Successfully promoted "codyw" to admin
   Email: your@email.com
   User ID: 1
```

### Step 3: Access the Admin Panel

1. Make sure you're logged in with your admin account
2. Navigate to: `http://localhost:3001/admin.html` (or your production URL)
3. You should see the admin panel with user statistics and the user table

## Using the Admin Panel

### View Users

The main table displays:
- User ID
- Username (with admin badge if applicable)
- Email
- Verification status
- Banked souls
- Creation date
- Last login date

### Search Users

Use the search box to filter users by username or email in real-time.

### Reset User Password

1. Click the "Reset Password" button next to any user
2. Enter a new password (minimum 8 characters)
3. Confirm the password
4. Click "Reset Password"

The user will be able to log in with the new password immediately.

## Security Notes

- Only users with `is_admin = TRUE` in the database can access admin endpoints
- All admin endpoints require a valid JWT token
- The token is verified and the admin status is checked on every request
- Password resets still enforce the 8-character minimum requirement
- All passwords are hashed with bcrypt before storing

## API Endpoints

### GET /admin/users
**Authorization:** Required (Admin only)

Returns all users with their details.

```javascript
// Request
GET /admin/users
Headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' }

// Response
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "codyw",
      "email": "cody@example.com",
      "isVerified": true,
      "isAdmin": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-02T00:00:00.000Z",
      "bankedSouls": 100
    }
  ]
}
```

### POST /admin/reset-password/:userId
**Authorization:** Required (Admin only)

Resets a user's password without requiring their current password.

```javascript
// Request
POST /admin/reset-password/2
Headers: {
  Authorization: 'Bearer YOUR_JWT_TOKEN',
  Content-Type: 'application/json'
}
Body: {
  "newPassword": "newpassword123"
}

// Response
{
  "success": true,
  "message": "Password reset for user johndoe"
}
```

## Troubleshooting

### "Access Denied" message
- Make sure you're logged in
- Verify your account has `is_admin = TRUE` in the database
- Run `node make-admin.js YOUR_USERNAME` to promote your account

### Users not loading
- Check browser console for errors
- Verify your JWT token is valid (try logging out and back in)
- Ensure the server is running and accessible

### Password reset fails
- Ensure the new password is at least 8 characters
- Check that both password fields match
- Verify you have admin privileges

## Production Deployment

When deploying to production:

1. The database schema will auto-migrate when the server starts
2. Use the make-admin script to promote your production admin user:
   ```bash
   node make-admin.js YOUR_PRODUCTION_USERNAME
   ```
3. Access the admin panel at `https://your-domain.com/admin.html`

## Additional Admin Features (Future)

Potential enhancements:
- Ban/unban users
- Delete user accounts
- View detailed user activity logs
- Bulk operations
- Email all users
- Adjust user souls/unlocked characters
- System-wide announcements
