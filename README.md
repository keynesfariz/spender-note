# BudgetManager

BudgetManager is an automated personal finance and budget tracking application. Instead of manually entering every expense, BudgetManager integrates with your email (via Gmail API) and automatically parses transaction notification emails using custom templates from your banks and e-wallets, categorizing and storing them for easy tracking.

## Features
- **Automated Expense Tracking**: Connects to your email to find transaction receipts and notifications.
- **Flexible Parsing Modes**: Choose between cost-free, custom regex-based templates or a powerful AI parser (using Gemini/Groq) to extract transaction details based on your preference.
- **Dashboard & Insights**: View your spending habits, manage wallets, and track budgets.
- **Manual Adjustments**: Bulk update tools and merge functionality for duplicate wallets or handling failed transactions.

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) & React 19
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) / Base UI
- **Integrations**: Gmail API (`googleapis`)

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed locally (we strongly prefer `bun` for package management).
- A Supabase project.
- Google Cloud Console project with Gmail API enabled and OAuth credentials.

### Installation & Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/budget-manager.git
   cd budget-manager
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Environment Variables**
   Create a `.env` or `.env.local` file in the root directory and populate it with your required keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Use the Supavisor connection pooling string (port 6543) for Drizzle
   DATABASE_URL=your_supabase_db_url
   
   # Parser Configuration
   PARSER_MODE=regex # Options: regex or ai
   
   # AI Provider Keys (Required only if PARSER_MODE=ai)
   GEMINI_API_KEY=your_gemini_key
   GROQ_API_KEY=your_groq_key
   
   # Gmail API OAuth credentials
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Database Setup**
   Generate and apply the Drizzle schema to your Supabase database:
   ```bash
   bun run db:generate
   bun run db:push
   ```

5. **Run the Development Server**
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Future Development
- **Design Revamp**: We are currently in the process of a major UI/UX overhaul to provide a more premium, modern, and cohesive design across the application.
- **More Bank Parsers**: Expanding our library of parsing templates to support a wider variety of banks and digital wallets globally.
- **Advanced Budgeting Rules**: Allow users to set up complex rules, custom categories, and alerts for different spending behaviors.
- **Investment & Asset Tracking**: Expand beyond basic expenses to track investment portfolios, loans, and overall net worth over time.
