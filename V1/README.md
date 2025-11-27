# Internities - Skill-Matching Internship Platform

A modern, minimal Next.js starter for a skill-matching internship platform connecting students with companies.

## Features

✅ **Built with Next.js 14** (App Router)  
✅ **JavaScript (No TypeScript)**  
✅ **TailwindCSS** for beautiful, responsive design  
✅ **Supabase Authentication** (sign up, login, logout)  
✅ **Clean Folder Structure** ready to scale  
✅ **Student & Company Dashboards** (placeholder pages)  
✅ **Landing Page** with hero section and features  
✅ **Environment-based Configuration**

## Project Structure

```
internities-v1/
├── app/
│   ├── layout.js                 # Root layout with Navbar
│   ├── globals.css              # Global Tailwind styles
│   ├── page.js                  # Landing page
│   ├── auth/
│   │   ├── signup/page.js       # Student/Company signup
│   │   └── login/page.js        # Login page
│   ├── student/page.js          # Student dashboard (protected)
│   └── company/page.js          # Company dashboard (protected)
├── components/
│   └── Navbar.js                # Navigation bar
├── lib/
│   └── supabaseClient.js        # Supabase client initialization
├── public/
│   └── (placeholder for assets)
├── .env.local                   # Environment variables (DO NOT COMMIT)
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm or yarn
- A Supabase account (https://supabase.com/)

### 1. Installation

Clone the repository and install dependencies:

```bash
cd internities-v1
npm install
```

### 2. Set Up Supabase

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up or log in
   - Create a new project
   - Wait for the project to initialize

2. **Get Your API Keys**
   - In your Supabase dashboard, go to **Settings** → **API**
   - Copy your **Project URL** and **Anon Key**

3. **Update Environment Variables**
   - Open `.env.local`
   - Replace the placeholders:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Save the file

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Pages Overview

### 🏠 Landing Page (`/`)

- Hero section with call-to-action buttons
- Features overview
- Quick navigation to signup/login

### 📝 Signup (`/auth/signup`)

- Email and password input
- Confirm password field
- Role selection (Student or Company via URL parameter: `?role=student` or `?role=company`)
- Redirects to `/student` or `/company` after successful signup

**Usage:**
- Students: [http://localhost:3000/auth/signup?role=student](http://localhost:3000/auth/signup?role=student)
- Companies: [http://localhost:3000/auth/signup?role=company](http://localhost:3000/auth/signup?role=company)

### 🔑 Login (`/auth/login`)

- Email and password input
- Role-based redirect after login
- Link to signup page

**Usage:**
- Students: [http://localhost:3000/auth/login?role=student](http://localhost:3000/auth/login?role=student)
- Companies: [http://localhost:3000/auth/login?role=company](http://localhost:3000/auth/login?role=company)

### 👤 Student Dashboard (`/student`)

- Protected page (redirects to login if not authenticated)
- Quick action cards:
  - Explore Internships
  - My Applications
  - Complete Profile
  - Saved Internships
- Quick stats section

### 🏢 Company Dashboard (`/company`)

- Protected page (redirects to login if not authenticated)
- Quick action cards:
  - Post Internship
  - Manage Listings
  - View Applications
  - Company Profile
- Quick stats section (Active Listings, Total Applications, etc.)

## Authentication Flow

### Sign Up
1. User fills email, password, confirm password
2. User selects role (Student or Company)
3. Supabase creates auth.users record
4. User redirected to dashboard
5. Email confirmation required (Supabase default)

### Login
1. User enters email and password
2. Supabase verifies credentials
3. User redirected to dashboard based on role
4. Session persists via Supabase cookies

### Logout
- Click "Logout" button in navbar or dashboard
- Session cleared
- Redirected to home page

## Customization

### Colors

Edit `tailwind.config.js` to change the color scheme:

```js
theme: {
  extend: {
    colors: {
      'brand-dark': '#0f172a',
      'brand-primary': '#3b82f6',
      'brand-secondary': '#8b5cf6',
      'brand-accent': '#ec4899',
      'brand-light': '#f8fafc',
    },
  },
},
```

### Fonts

Edit `app/globals.css` to use custom fonts (Google Fonts, etc.):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

### API Calls

Add API routes in `app/api/` for backend logic:

```
app/
├── api/
│   ├── auth/
│   │   └── callback/route.js
│   ├── internships/
│   │   ├── route.js       # GET/POST internships
│   │   └── [id]/route.js  # GET/PUT/DELETE specific internship
│   └── applications/
│       └── route.js       # POST applications
```

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**
   - In Vercel dashboard: **Settings** → **Environment Variables**
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     ```
   - Click "Deploy"

4. **Custom Domain** (optional)
   - In Vercel: **Settings** → **Domains**
   - Add your custom domain

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` is in the project root
- Check keys are correct (copy-paste from Supabase dashboard)
- Restart dev server: `npm run dev`

### "Email already exists"
- User already signed up with that email
- Try a different email or reset password in Supabase dashboard

### "Session not persisting after logout"
- Clear browser cookies for localhost
- Restart dev server

### Dashboard shows "Loading..." forever
- Check browser console for errors (F12 → Console)
- Verify Supabase keys in `.env.local`
- Make sure you confirmed email (if required by Supabase)

## Next Steps

After the scaffold is complete, you can add:

- ✅ Database schema (students, companies, internships, applications tables)
- ✅ API endpoints for CRUD operations
- ✅ Profile pages with forms
- ✅ Internship listing and search
- ✅ Application submission flow
- ✅ Skill-matching algorithm
- ✅ Notifications and messaging
- ✅ Admin dashboard

## Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **TailwindCSS Docs:** https://tailwindcss.com/docs
- **Vercel Deployment:** https://vercel.com/docs

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Happy coding! 🚀**
