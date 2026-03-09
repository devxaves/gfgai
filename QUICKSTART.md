# Viz.ai - Authentication Quick Start Guide

## 🚀 Quick Start (2 minutes)

### 1. Start the Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Visit Landing Page

Go to `http://localhost:3000` → See the beautiful landing page

### 3. Three Ways to Access Dashboard

#### Option A: Sign Up (NEW ACCOUNT)

1. Click **"Sign Up"** button in top nav
2. Fill in: Name, Email, Password
3. Get redirected to **dashboard** (`/dashboard`)
4. Your profile appears in sidebar

#### Option B: Sign In (EXISTING ACCOUNT)

1. Click **"Sign In"** button
2. Use your email and password
3. Get redirected to **dashboard** (`/dashboard`)
4. See your saved chats in sidebar

#### Option C: Try Demo (NO SIGNUP)

1. Click "Try Demo" on landing page
2. Full dashboard access instantly at `/dashboard`
3. Upload data, run queries, use all features
4. Chats not saved (sign in to save)

---

## 👤 User Experience

### Regular User

```
Landing → Sign In/Up → Dashboard (/dashboard)
  ↓
  Access all features
  Save chats automatically
  View profile in sidebar
  Sign out anytime
```

### Demo User

```
Landing → Click "Demo First" → Dashboard (/dashboard)
  ↓
  Use all features
  Chats NOT saved
  Click "Sign In" to save work
```

### Admin User

```
Regular User + Admin Panel access

Sidebar: "Admin Panel" link
  ↓
  View all users
  See statistics
  Monitor activity
```

---

## 📋 Test Account (Create One)

### Create Test User

1. Go to `http://localhost:3000`
2. Click "Sign Up"
3. Fill form:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
4. Click "Sign Up"
5. You're logged in!

### Sign In Again

1. Reload page or go to `/auth`
2. Switch to "Sign In" tab
3. Enter email and password
4. Redirected to dashboard

---

## 🎨 What You'll See

### Landing Page

```
┌─────────────────────────────────────┐
│  Viz.ai  │ [Sign In] [Sign Up]   │
├─────────────────────────────────────┤
│  Turn Raw Data Into Instant          │
│  Decisions                           │
│                                     │
│  [Get Started] [Demo First]         │
│                                     │
│  Features (6 cards)                 │
│  Example Dashboard Images           │
│  Call-to-action Section             │
└─────────────────────────────────────┘
```

### Auth Page

```
┌──────────────────────────────┐
│     Viz.ai                 │
│  [Sign In] [Sign Up]         │
├──────────────────────────────┤
│
│  Full Name: [____________]   │
│  Email: [_______________]    │
│  Password: [____________]    │
│  Confirm: [____________]     │
│                              │
│  [Sign Up] → 📊 Dashboard   │
│                              │
│  Already have account?       │
│  [Sign In]                   │
│                              │
│  ───────────────────────────│
│  [Continue as Demo User]     │
│                              │
└──────────────────────────────┘
```

### Dashboard (Authenticated)

```
┌───────────────────────────────────┐
│  Sidebar              Main Content│
│  ┌─────────────────┐ ┌──────────┐│
│  │Profile Card:    │ │Dashboard ││
│  │ 👤 John Doe     │ │          ││
│  │ john@example.com│ │          ││
│  │ [Sign Out]      │ │          ││
│  │ [Admin Panel]   │ │          ││
│  │ (if admin)      │ │          ││
│  ├─────────────────┤ │          ││
│  │Dashboard        │ │          ││
│  │Data Sources     │ │          ││
│  │Query History    │ │          ││
│  │Insights         │ │          ││
│  │Settings         │ │          ││
│  │                 │ │          ││
│  │Recent Chats:    │ │          ││
│  │• Query 1        │ │          ││
│  │• Query 2        │ │          ││
│  │• Query 3        │ │          ││
│  ├─────────────────┤ │          ││
│  │🌙 Dark Mode     │ │          ││
│  └─────────────────┘ └──────────┘│
└───────────────────────────────────┘
```

### Admin Panel

```
┌─────────────────────────────────┐
│ 👮 Admin Dashboard              │
│ Manage users and monitor         │
│                                 │
│ [Total Users: 5] [Total Chats: 23]
│ [Active Users: 4]               │
│                                 │
│ All Users Table:                │
│ ┌──────────────────────────────┐│
│ │Name│Email│Role│Chats│Joined││
│ ├──────────────────────────────┤│
│ │John│j@..│User│  5  │2/15/25││
│ │Jane│ja..│User│  3  │2/16/25││
│ │You │y@..│Admin│ 2  │2/14/25││
│ └──────────────────────────────┘│
└─────────────────────────────────┘
```

---

## 🔑 Key Features

| Feature      | Demo User | Regular User | Admin  |
| ------------ | --------- | ------------ | ------ |
| Dashboard    | ✅ Yes    | ✅ Yes       | ✅ Yes |
| Upload Data  | ✅ Yes    | ✅ Yes       | ✅ Yes |
| Save Chats   | ❌ No     | ✅ Yes       | ✅ Yes |
| View Chats   | ❌ No     | ✅ Yes       | ✅ Yes |
| Admin Panel  | ❌ No     | ❌ No        | ✅ Yes |
| User Profile | ❌ No     | ✅ Yes       | ✅ Yes |

---

## 🛠️ Troubleshooting

### Problem: "Cannot find module auth"

**Solution:** Ensure `lib/auth.ts` exists in the project

### Problem: MongoDb connection fails

**Solution:** Check `MONGODB_URI` in `.env` file

### Problem: Signup fails

**Solution:**

- Check email is not already registered
- Ensure password is at least 6 characters
- Verify MongoDB connection

### Problem: Cannot see Admin Panel

**Solution:** Login with an admin account (create with role='admin' in MongoDB)

### Problem: Chats not saving

**Solution:**

- Ensure you're logged in (not demo user)
- Check MongoDB connection
- Browser console for errors

---

## 📱 Mobile Experience

✅ Fully responsive design
✅ Touch-friendly buttons
✅ Hamburger menu on mobile
✅ Full sidebar collapse
✅ Optimized form layout
✅ Dark mode on mobile

---

## 🔐 Your Data

- **Passwords:** Hashed with PBKDF2 (never stored plain)
- **Cookies:** HTTP-only (JavaScript cannot access)
- **Transmission:** HTTPS in production
- **Database:** MongoDB with access control
- **Sessions:** 30-day expiration

---

## 📞 Support

If something doesn't work:

1. Check browser console (F12)
2. Check server logs (npm run dev terminal)
3. Verify MongoDB is running
4. Verify `.env` file has correct credentials
5. Clear browser cookies and try again

---

## 🎉 That's It!

You now have a fully functional authentication system with:

- ✅ User registration & login
- ✅ Secure password storage
- ✅ Chat persistence
- ✅ Admin dashboard
- ✅ Demo mode
- ✅ Beautiful UI
- ✅ Dark mode support

**Enjoy! 🎊**
