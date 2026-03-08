# Vizly AI — Conversational AI for Business Intelligence

> Type a plain English question. Get an interactive data dashboard instantly.  
> Powered by Google Gemini AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Gemini](https://img.shields.io/badge/Gemini_AI-Powered-purple?logo=google)

## ✨ Features

- **Natural Language Queries** — Ask questions like "Show me revenue by region" and get instant charts
- **Multi-Chart Dashboards** — Generates bar, line, pie, area, and stacked charts
- **KPI Cards** — Animated metrics with trend indicators
- **AI Narrative** — Executive summary explaining what the charts reveal
- **Follow-Up Suggestions** — AI-generated follow-up questions for deeper analysis
- **Chart Type Switcher** — Instantly switch between bar/line/pie/area without re-querying
- **Chart Download** — Export any chart as PNG
- **Voice Input** — Speak your query using Web Speech API (Chrome/Edge)
- **CSV Upload** — Upload your own data and query it instantly
- **Conversation Context** — Follow-up queries understand previous context
- **Dark Mode** — Full dark mode support
- **Mobile Responsive** — Collapsible sidebar, works on all screen sizes

## 🛠 Tech Stack

| Layer         | Technology              |
| ------------- | ----------------------- |
| Framework     | Next.js 16 (App Router) |
| Language      | TypeScript 5            |
| AI            | Google Gemini API       |
| Styling       | Tailwind CSS 4          |
| Charts        | Recharts                |
| Animations    | Framer Motion           |
| State         | Zustand                 |
| Icons         | Lucide React            |
| CSV Parsing   | PapaParse               |
| Local Storage | Dexie.js (IndexedDB)    |

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your Gemini API key

# 3. Start development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

**Get a Gemini API key:** https://aistudio.google.com/apikey (free tier available)

> No database setup required! Vizly AI uses a built-in 155-row sales dataset.

## 📊 Test Queries

Try these queries to see Vizly AI in action:

### Simple

- "Show me total revenue by region"
- "What is the revenue breakdown by product category?"
- "Who are the top 5 sales reps by revenue?"

### Medium

- "Show monthly revenue trend for 2024"
- "Compare revenue and cost by category"
- "Which customer segment generates the most orders?"

### Complex

- "Show Q3 revenue broken down by region"
- "What is the profit margin by product category?"
- "Monthly revenue trend for Laptops in the North region"

### Follow-ups

- Ask "Show revenue by region" → then "Now filter to Enterprise customers"
- Ask "Show monthly trend" → then "Break this down by category"

## 📁 Project Structure

```
gfgai/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── history/page.tsx      # Query history timeline
│   ├── sources/page.tsx      # Data source management
│   ├── insights/page.tsx     # AI-generated insights
│   ├── settings/page.tsx     # App configuration
│   └── api/
│       └── analyze-query/    # Gemini AI + query execution
├── components/
│   ├── charts/
│   │   ├── DynamicChart.tsx   # Multi-type chart renderer
│   │   └── KPICard.tsx        # Animated KPI cards
│   ├── dashboard/
│   │   ├── QueryInput.tsx     # Voice + text query input
│   │   ├── Workspace.tsx      # Dashboard grid with charts
│   │   ├── DatasetUploader.tsx # CSV/JSON file upload
│   │   ├── SkeletonDashboard.tsx # Progressive loading
│   │   └── ErrorCard.tsx      # Styled error display
│   └── layout/
│       ├── Sidebar.tsx        # Navigation sidebar
│       └── LogoBadge.tsx      # Logo component
├── data/
│   └── sales.json            # Built-in 155-row dataset
├── lib/
│   ├── gemini.ts             # Gemini API client
│   ├── queryExecutor.ts      # Server-side query engine
│   ├── localDatabase.ts      # IndexedDB (Dexie) wrapper
│   └── localQueryEngine.ts   # Client-side query engine
├── store/
│   └── useDashboardStore.ts  # Zustand state management
└── types/
    └── index.ts              # Shared TypeScript types
```

## 🔑 API

### POST /api/analyze-query

Accepts a natural language query and returns chart data + KPIs + narrative.

```json
{
  "prompt": "Show me revenue by region",
  "dataSource": "server",
  "conversationHistory": []
}
```

Response includes: `metrics`, `charts`, `summary`, `followUpSuggestions`

## 📄 License

MIT
