# Admin Account Management Guide

## Overview

The admin panel now includes a complete **Admin Accounts** management system that allows you to create, edit, and manage admin users directly from the web interface.

---

## Accessing Admin Accounts

1. **Log in to the admin panel** at `/admin/login`
2. **Navigate to "Admin Accounts"** in the sidebar (👤 icon)
3. You'll see a list of all admin accounts

---

## Creating a New Admin Account

### Method 1: Using the Admin Panel (Recommended)

1. Go to **Admin Accounts** page (`/admin/accounts`)
2. Click **"Create Admin Account"** button
3. Fill in the form:
   - **Email** (required): The admin's email address
   - **Password** (required): Minimum 6 characters
   - **Name** (optional): Display name for the admin
4. Click **"Create Admin"**
5. The new admin account will be created and can immediately log in

### Method 2: Using the API Endpoint

```bash
curl -X POST http://localhost:3000/api/admin/accounts \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_SESSION_COOKIE" \
  -d '{
    "email": "newadmin@yametee.com",
    "password": "securepassword123",
    "name": "New Admin"
  }'
```

### Method 3: Using Node Script

```bash
node scripts/create-admin.js newadmin@yametee.com securepassword123 "New Admin"
```

### Method 4: Auto-Create on First Login

If no admin accounts exist, you can auto-create one by:

1. Going to `/admin/login`
2. Entering an email containing "admin" (e.g., `admin@yametee.com`)
3. Entering any password
4. The system will automatically create the admin account

---

## Managing Admin Accounts

### Viewing Admin Accounts

- **List View**: See all admin accounts with:
  - Name
  - Email
  - Phone
  - Number of orders
  - Creation date

### Editing an Admin Account

1. Click **"Edit"** button next to an admin account
2. Update:
   - **Password**: Enter new password (leave blank to keep current)
   - **Name**: Update display name
3. Click **"Update"**

**Note**: Email cannot be changed after creation.

### Removing Admin Access

1. Click **"Remove Access"** button next to an admin account
2. Confirm the action
3. The account will lose admin access but remain as a regular customer

**Security**: You cannot remove your own admin access.

---

## API Endpoints

### GET `/api/admin/accounts`

List all admin accounts (requires admin authentication)

**Response:**

```json
{
  "admins": [
    {
      "id": "clx...",
      "email": "admin@yametee.com",
      "name": "Admin User",
      "phone": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "orders": 5
      }
    }
  ]
}
```

### POST `/api/admin/accounts`

Create a new admin account (requires admin authentication)

**Request Body:**

```json
{
  "email": "admin@yametee.com",
  "password": "securepassword123",
  "name": "Admin Name"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Admin account created successfully",
  "admin": {
    "id": "clx...",
    "email": "admin@yametee.com",
    "name": "Admin Name"
  }
}
```

### PATCH `/api/admin/accounts/[id]`

Update an admin account (requires admin authentication)

**Request Body:**

```json
{
  "password": "newpassword123", // Optional
  "name": "Updated Name" // Optional
}
```

### DELETE `/api/admin/accounts/[id]`

Remove admin access from an account (requires admin authentication)

**Response:**

```json
{
  "success": true,
  "message": "Admin access removed successfully"
}
```

---

## Security Features

1. **Authentication Required**: All admin account operations require admin authentication
2. **Password Validation**: Minimum 6 characters
3. **Email Validation**: Must be a valid email format
4. **Self-Protection**: Cannot delete your own admin account
5. **Password Hashing**: All passwords are securely hashed using bcrypt

---

## How Admin Accounts Work

- **Admin accounts** are regular `Customer` records with a `hashedPassword` field set
- When a customer has a `hashedPassword`, they can log in to the admin panel
- Removing admin access clears the `hashedPassword`, making them a regular customer
- Admin accounts can still place orders like regular customers

---

## Troubleshooting

### "Unauthorized" Error

- Make sure you're logged in to the admin panel
- Check that your session cookie is valid

### "Email already exists"

- The email is already registered
- If it's a regular customer, you can convert them to admin by setting a password
- If it's already an admin, use the Edit function instead

### "Password must be at least 6 characters"

- Ensure password meets minimum length requirement
- Use a strong password for security

### Cannot Remove Own Admin Access

- This is a security feature
- Have another admin remove your access, or use the database directly

---

## Quick Start

1. **First Admin**: Use auto-create method or API endpoint
2. **Additional Admins**: Use the Admin Accounts page in the panel
3. **Manage**: Edit passwords, update names, or remove access as needed

---

**Last Updated**: 2025-01-XX  
**Status**: ✅ Fully Functional
