# Project Todo List - Vizly AI

Based on the PRD, Design Document, and Tech Rules, here is the feature-specific breakdown for the Conversational AI Business Intelligence Dashboard Generator.

## Phase 1: Project Setup & Technical Foundation

- [ ] Initialize Next.js project with App Router and TypeScript (`npx create-next-app@latest`).
- [ ] Install and configure Tailwind CSS.
- [ ] Set up the UI component library using `shadcn/ui`.
- [ ] Add state management library `Zustand` and create the base `useDashboardStore`.
- [ ] Configure MongoDB Atlas connection using `mongoose`.
- [ ] Set up environment variables (`.env.local`) for MongoDB URI and Google Gemini API key.
- [ ] Initialize Git repository with main and development branches.

## Phase 2: Design System & Core Layout

- [ ] Define Color Palette (Primary Blue, Light Gray, Soft Orange, Green) in `tailwind.config.js`.
- [ ] Implement Typography (Inter font) and Spacing (4px grid system).
- [ ] Build the three-zone application layout (Sidebar Navigation, Query Bar, Dashboard Workspace).
- [ ] Create basic responsive UI components (Buttons, Inputs, Cards).
- [ ] Implement the Sidebar Navigation component with outlined icons.

## Phase 3: Data Management & Database Setup

- [ ] Create Mongoose schema for the primary database (e.g., Sales schema with product, region, revenue, date).
- [ ] Implement IndexedDB setup (using `Dexie.js`) for handling local browser storage of uploaded datasets.
- [ ] Develop database aggregation pipeline templates for querying metrics and dimensions.

## Phase 4: AI Integration & Query Builder Pipeline

- [ ] Build the Next.js API Route (`/app/api/analyze-query/route.ts`).
- [ ] Integrate Google Gemini API via REST.
- [ ] Create the prompt engineering system (combine user request + dataset schema).
- [ ] Develop the LLM response parser to extract `metric`, `dimension`, `filters`, and `chartType`.
- [ ] Build the Query Builder Engine to convert structured LLM JSON output to MongoDB Aggregation queries or IndexedDB queries.
- [ ] Implement query validation to prevent unsafe or incorrect database access.

## Phase 5: Dashboard Output & Chart Rendering

- [ ] Install and configure the `recharts` charting library.
- [ ] Build dynamic chart components: Line Chart, Bar Chart, Pie Chart, Stacked Bar.
- [ ] Develop the Dashboard Card System (Title, Subtitle, Metric, Chart, Legend) with subtle shadows and hover elevation.
- [ ] Create KPI Cards for executive insights (e.g., Total Revenue, Sales Growth).
- [ ] Implement the Chart Responsive Grid Layout (Desktop: 2x2, Tablet: 2x1, Mobile: 1x1).

## Phase 6: Loading States & Interactive UI

- [ ] Add Framer Motion and implement card fade-in/chart loading animations.
- [ ] Build the AI processing skeleton loader and "AI Thinking Animation" ("Analyzing data...").
- [ ] Add chart interactions: Tooltips on hover, legend toggling, and zoom.

## Phase 7: Conversational Flow & Chat with Dashboard

- [ ] Create the primary Landing / Query Screen with logo, query input box, and example prompts.
- [ ] Implement "Chat With Dashboard" functionality to refine existing dashboards (e.g., "Filter to East region").
- [ ] Add AI Query Suggestions capabilities.
- [ ] Handle error states clearly (e.g., Ambiguous queries or missing fields).

## Phase 8: Dataset Upload (Bonus Feature)

- [ ] Build the Dataset Upload Screen with drag-and-drop for CSV/JSON.
- [ ] Implement browser-side parsing for CSV/JSON files.
- [ ] Automatically determine and map dataset schema to IndexedDB.
- [ ] Allow users to query the newly uploaded local dataset immediately.

## Phase 9: Polish, Testing, and Deployment

- [ ] Conduct performance testing (dashboard generation under 5 seconds).
- [ ] Ensure full responsiveness across Desktop, Tablet, and Mobile.
- [ ] Review codebase for TypeScript validation, ESLint, and Prettier rules.
- [ ] Deploy the application to Vercel.
- [ ] Prepare the 10-Minute Presentation and finalize the public GitHub repository.
