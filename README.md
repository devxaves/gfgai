# Vizly AI — Conversational Business Intelligence Dashboard

<p align="center">
  Generate interactive dashboards instantly through natural language queries. No SQL required.
</p>

---

## ✨ Features

- **Natural Language Queries** — Type questions like "Show me revenue by region" and get instant dashboards
- **AI-Powered Analysis** — Google Gemini interprets your questions and selects optimal chart types
- **Dynamic Charts** — Bar, Line, Pie, Area, and Stacked charts rendered with Recharts
- **CSV/JSON Upload** — Upload your own dataset and query it immediately in the browser
- **Conversational Follow-ups** — Refine dashboards with follow-up questions ("Now filter to East region")
- **KPI Cards** — Executive-level metric summaries with trend indicators
- **AI Insights** — Auto-generated insights from your data analysis
- **Dark Mode** — Full dark theme with OKLCH color system
- **Responsive Design** — Works on desktop, tablet, and mobile

---

## 🛠 Tech Stack

| Layer              | Technology              |
| ------------------ | ----------------------- |
| Framework          | Next.js 16 (App Router) |
| Language           | TypeScript              |
| UI Components      | shadcn/ui               |
| Styling            | Tailwind CSS 4          |
| State Management   | Zustand                 |
| AI                 | Google Gemini API       |
| Charts             | Recharts                |
| Animations         | Framer Motion           |
| Database (Server)  | MongoDB + Mongoose      |
| Database (Browser) | IndexedDB + Dexie.js    |
| CSV Parsing        | PapaParse               |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **npm** (comes with Node.js)
- **Google Gemini API Key** — [Get one free here](https://aistudio.google.com/apikey)
- **MongoDB Atlas** (optional) — [Create a free cluster](https://www.mongodb.com/cloud/atlas)

### Environment Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/devxaves/Vizly AI.git
   cd Vizly AI
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and fill in your values:

   ```env
   # REQUIRED — Get from https://aistudio.google.com/apikey
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

   # OPTIONAL — Leave blank to use local CSV mode
   # Get from https://www.mongodb.com/cloud/atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vizlyai

   # App URL (keep as-is for local development)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   > **Note:** If `MONGODB_URI` is left blank, InsightAI runs in **local-only mode**. Upload a CSV file and start querying immediately — no database required!

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

---

## 📊 How to Use

### Option A: Upload Your Own Data

1. Click **"Upload Data"** in the header
2. Select a CSV or JSON file
3. View the detected schema
4. Start asking questions about your data!

### Option B: Use MongoDB Demo Data

1. Set `MONGODB_URI` in `.env` to your MongoDB cluster
2. Seed the database with demo data (see below)
3. Ask questions like "Show me revenue by region"

### Example Queries

- `Show me total revenue by region`
- `Compare product categories by sales`
- `Monthly revenue trend over time`
- `Top 5 products by revenue`
- Follow-up: `Now filter to East region only`

---

## 📁 Project Structure

```
Vizly AI/
├── app/
│   ├── api/analyze-query/   → AI query processing API
│   ├── history/             → Query history page
│   ├── sources/             → Data sources management
│   ├── insights/            → AI-generated insights
│   ├── settings/            → App preferences
│   ├── layout.tsx           → Root layout with dark mode
│   ├── page.tsx             → Main dashboard
│   └── globals.css          → Design system tokens
├── components/
│   ├── charts/              → DynamicChart, KPICard
│   ├── dashboard/           → QueryInput, Workspace, DatasetUploader, etc.
│   ├── layout/              → Sidebar, DarkModeProvider
│   └── ui/                  → shadcn/ui primitives
├── lib/
│   ├── gemini.ts            → Google Gemini AI client
│   ├── localDatabase.ts     → IndexedDB (Dexie) for CSV storage
│   ├── localQueryEngine.ts  → In-browser aggregation engine
│   └── mongodb.ts           → MongoDB connection
├── models/                  → Mongoose schemas
├── store/                   → Zustand state management
├── types/                   → Shared TypeScript interfaces
└── docs/                    → PRD, design docs, tech rules
```

---

## 🔌 API Endpoints

### `POST /api/analyze-query`

Sends a natural language query to Gemini and returns dashboard data.

**Request:**

```json
{
  "prompt": "Show me revenue by region",
  "dataSource": "local",
  "conversationHistory": [],
  "localSchema": ["product", "region", "revenue", "date"]
}
```

**Response (local mode):**

```json
{
  "success": true,
  "mode": "local",
  "queryPlan": {
    "charts": [...],
    "kpis": [...],
    "summary": "Revenue breakdown by region"
  }
}
```

---

## 🌙 Dark Mode

Toggle dark mode from the sidebar or Settings page. Your preference is saved to localStorage.

---

## 📦 Deployment

Deploy to Vercel:

```bash
npm run build
```

Then push to GitHub and connect to [Vercel](https://vercel.com). Set environment variables in the Vercel dashboard.

---

## 📄 License

MIT
