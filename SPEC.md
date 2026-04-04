# Shadow CFO - MVP Specification (Local Mode)

## Status: READY FOR DEMO ✅

**Last Updated:** 2026-04-04

---

## Architecture

### Current Setup (No Database Required)
- **Frontend:** Next.js (static export capable)
- **Backend:** Local state (no database)
- **Deployment:** Vercel (current) or Render (recommended)
- **Data:** In-memory/demo data

### Features Working
- [x] Dashboard with Solvency Score
- [x] Findings list (5 categories)
- [x] Fix Queue with actions
- [x] $SOLV rewards system
- [x] Fluency Quiz (10 questions)
- [x] CPA Memo generation (downloadable)
- [x] Mobile responsive

---

## Deployment Options

### Option 1: Vercel (Current)
- URL: https://shadow-cfo.vercel.app
- Already deployed and working

### Option 2: Render (Recommended)
1. Go to https://render.com
2. Connect your GitHub repo
3. Create Web Service
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Deploy

---

## Demo Flow

1. Open app → Click "Start Demo"
2. See Dashboard with Sarah's data
3. Browse Findings, Fix Queue, $SOLV, Quiz
4. Complete actions → earn $SOLV
5. Download CPA Memo
6. Take Quiz → see score

---

## Technical Notes

### No Database
- All data is local/in-memory
- Actions persist only in current session
- Demo mode uses seeded data

### Future (With Database)
- Add Supabase/PostgreSQL
- Add user authentication
- Persist findings and actions

---

## File Structure

```
app/
├── page.tsx          # Main app (local mode)
├── layout.tsx        # Root layout
└── globals.css       # Global styles

SPEC.md               # This file
render.yaml           # Render deployment config
```

---

## Commands

```bash
npm run dev      # Development
npm run build    # Production build
npm start        # Start production server
```
