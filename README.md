# Java Backup Console

A modern SaaS dashboard for uploading, compiling, and managing Java backup files.

## Features

- Upload .java files with custom titles
- Real-time Java compilation and console output
- Date-based file organization with cards
- Search and filter (A-Z, Z-A, date)
- User authentication with nicknames
- Liquid glass UI with emerald green theme
- Fully responsive design
- JSON-based database (no SQL required)

## Tech Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Lucide React Icons
- bcryptjs + JWT for auth
- JSON file-based database

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your JWT secret in `.env.local`:
   ```
   JWT_SECRET=your-secret-key-here
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add `JWT_SECRET` environment variable
4. Deploy

## Project Structure

```
app/
  api/
    auth/         - Login/register endpoints
    compile/      - Java compilation endpoint
    files/        - File CRUD endpoints
  dashboard/      - Main dashboard page
  login/          - Login page
  register/       - Registration page
  layout.js       - Root layout
  page.js         - Landing page
components/
  FileCard.js     - File display card
  FileUpload.js   - Upload component
  JavaOutput.js   - Console output display
  Navbar.js       - Navigation bar
  SearchFilter.js - Search and sort
  Sidebar.js      - Sidebar (reserved)
data/
  db.js           - JSON database operations
lib/
  auth.js         - Authentication utilities
  compile.js      - Java compilation simulation
styles/
  globals.css     - Global styles with glass theme
```

## Note

Java compilation is simulated for serverless compatibility. For real JDK compilation, deploy with Docker or use a cloud function with Java installed.
