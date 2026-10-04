# *Disce!* — Oxford Latin Study Companion

[![Deploy to GitHub Pages](https://github.com/MasonK2026/Disce-Flashcards/actions/workflows/deploy.yml/badge.svg)](https://github.com/MasonK2026/Disce-Flashcards/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live_Site-GitHub_Pages-blue?style=flat&logo=github)](https://masonk2026.github.io/Disce-Flashcards/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_RPC-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

*Disce!* is a fast, responsive, and feature-rich Latin vocabulary and grammar study application designed specifically for the ***Oxford Latin Course (College Edition)***. It covers all 53 chapters across Parts I, II, and III, featuring interactive study modes, smart search with orthographic normalization, custom deck creation, community-driven grammar tagging, and cross-device sync powered by a 6-digit PIN system.

---

## ✨ Features

### 📖 Complete 53-Chapter Vocabulary
- Curated vocabulary directly mapped to Chapters 1 through 53 of the *Oxford Latin Course*.
- Divided by grammatical category: **Verbs**, **Nouns**, **Adjectives**, **Adverbs**, **Prepositions**, **Conjunctions**, and **Pronouns**.
- Full principal parts, declension, gender, and definition details preserved for each word.

### 🎯 Universal Chapter & Subgroup Selector
- Filter your active study pool to any combination of the 53 chapters at any time.
- 1-click batch selection for:
  - **Part I:** Chapters 1–16
  - **Part II:** Chapters 17–32
  - **Part III:** Chapters 33–53
- Persists automatically to your active session and syncs to your account.

### 🔍 Quick Search & Filterable Dictionary
- **Global Shortcut:** Press <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>Cmd</kbd> + <kbd>K</kbd>) anywhere in the application to open the instant Quick Search modal.
- **Orthographic Normalization:** Search query engine automatically handles:
  - Macron insensitivity (`ā`, `ē`, `ī`, `ō`, `ū` match `a`, `e`, `i`, `o`, `u`).
  - Consonantal & vowel variations (`u` ↔ `v`, `i` ↔ `j`).
  - Punctuation and whitespace stripping.
- **Deep Dictionary Filters:**
  - Part of Speech (Verb, Noun, Adjective, Adverb, Preposition, Conjunction, Pronoun, Other).
  - Verb Conjugation (1st, 2nd, 3rd, 3rd-io, 4th, Irregular, Deponent).
  - Noun Declension (1st through 5th) and Gender (Masculine, Feminine, Neuter, Plural).
  - Adjective Classification (1st/2nd Declension, 3rd Declension, Indeclinable).
- **1-Click External Lexicon Links:**
  - [Vocabula.lat](https://vocabula.lat) (dictionary definition & forms)
  - [Latin-is-Simple](https://www.latin-is-simple.com) (morphological analysis)
  - [Cactus2000](https://latin.cactus2000.de) (full conjugation tables for verbs)

### 🗂️ Interactive Study & Flashcards
- **Fluid Card Flipping:** Flip using <kbd>Space</kbd> or click/tap; navigate cards using arrow keys (<kbd>←</kbd> / <kbd>→</kbd>).
- **Bidirectional Study:** Switch between Latin → English and English → Latin at any point.
- **Progress Tracking:**
  - Mark cards as **Memorized** to track mastery.
  - Star cards as **Favorites** for targeted review.
- **Direct Tagging:** Edit or correct grammar tags directly from the flashcard face.

### 📦 Custom Decks & Custom Cards
- Build and organize custom vocabulary decks tailored to upcoming exams or specific reading passages.
- Add official words from the 53 chapters or create completely custom Latin cards with custom definitions, principal parts, declensions, and conjugation notes.
- Flag custom cards as **Deponent** or **Irregular**.

### 🤝 Honor-System Community Grammar Overrides
- Anyone can correct or enrich a word's classification (e.g. conjugation, declension, regularity) directly in the UI.
- Updates are saved to a shared Supabase database (`community_classifications`), instantly making corrections visible to all learners across the world.
- Offline-resilient with local storage fallback caching.

### 🔑 6-Digit PIN Cloud Accounts
- **Zero Friction:** No email, password, or third-party OAuth required.
- **Instant Generation:** 1-click generates a unique 6-digit PIN that identifies your cloud profile.
- **Seamless Cross-Device Sync:** Log in with your PIN on mobile, tablet, or desktop to sync:
  - Active chapter selections and study directions.
  - Card progress, memorization status, and favorited words.
  - Custom decks and user-created vocabulary cards.
- **Automatic Background Sync:** Debounced sync pushes local edits ~1.5s after changes, and detects cloud updates on startup.
- **Privacy & Security:** Profile tables are shielded by Row Level Security (RLS) and can only be accessed or modified via `SECURITY DEFINER` RPCs requiring the exact PIN.

---

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 8](https://vite.dev/) + [Oxlint](https://oxc.rs/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite` |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) with `persist` middleware |
| **Routing** | [React Router v7](https://reactrouter.com/) (`HashRouter` for GitHub Pages) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend & Sync** | [Supabase](https://supabase.com/) (PostgreSQL + RLS + RPCs) |
| **Hosting & CI/CD** | [GitHub Pages](https://pages.github.com/) + [GitHub Actions](https://github.com/features/actions) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MasonK2026/Disce-Flashcards.git
   cd Disce-Flashcards
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173` (or the port shown in your terminal).

4. **Build for production:**
   ```bash
   npm run build
   ```
   Compiles optimized production bundles into the `dist/` directory.

5. **Preview production build locally:**
   ```bash
   npm run preview
   ```

---

## 🌐 Deployment to GitHub Pages

This repository is configured to automatically build and deploy via **GitHub Actions** whenever changes are pushed to the `main` branch.

### Automatic Deployment (CI/CD)
The workflow file [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) handles:
1. Triggering on any push to `main`.
2. Installing dependencies and executing `npm run build`.
3. Pushing the compiled `dist/` artifacts directly to the `gh-pages` deployment branch using `JamesIves/github-pages-deploy-action`.

### Configuring GitHub Pages in your Repository Settings
Ensure your repository's Pages settings are configured as follows:
1. Navigate to **Settings** → **Pages** in your GitHub repository.
2. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
3. Under **Branch**, select `gh-pages` and `/ (root)`.
4. Click **Save**.

### Manual Deployment (Optional)
If you ever wish to deploy manually from your machine:
```bash
npm run deploy
```
*(This triggers `predeploy` to build the app, then uses the `gh-pages` CLI to publish `dist/` to the `gh-pages` branch).*

---

## 🗄️ Backend Setup (Supabase)

*Disce!* uses a lightweight, serverless Supabase backend for global grammar overrides and PIN-based user profile persistence.

### Database Setup
The entire database schema and stored procedures are defined in [`supabase/schema.sql`](supabase/schema.sql).

To deploy or inspect the database:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and execute (**Run**).

### Security Architecture
- **Publishable Key Only:** The client bundle only contains the Supabase project URL and the public `anon` publishable key. The secret service role key is **never** included or exposed.
- **Row Level Security (RLS):**
  - `community_classifications`: Public read, insert, and update permissions are enabled with payload size limits. Deletions are forbidden.
  - `user_profiles`: RLS is enabled with **zero public policies** (default deny). Direct reads, enumeration, and queries from the browser are blocked.
  - Access to profiles is strictly mediated via three `SECURITY DEFINER` stored functions (`create_profile`, `get_profile`, `save_profile`) that require the exact 6-digit PIN.

---

## 📁 Project Structure

```
Disce-Flashcards/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated CI/CD GitHub Pages deployment
├── public/
│   └── data/                   # 53 JSON vocabulary files (ch1.json to ch53.json)
├── src/
│   ├── assets/                 # App logos, illustrations, and static assets
│   ├── components/
│   │   ├── chapter/            # Universal Subgroup & Chapter Selector modal
│   │   ├── deck/               # Custom Deck & Custom Card creation modals
│   │   ├── flashcard/          # Interactive flip-card & study controls
│   │   ├── grammar/            # Grammar badges & honor-system edit modal
│   │   ├── layout/             # Navigation header, footer, and keyboard handlers
│   │   └── search/             # Ctrl+K Quick Search modal
│   ├── lib/
│   │   ├── grammarParser.ts    # Latin grammar classification engine
│   │   ├── latinNormalize.ts   # Macron & orthographic search normalizer
│   │   └── supabase.ts         # Supabase client configuration
│   ├── pages/
│   │   ├── AccountPage.tsx     # 6-digit PIN account login & cloud sync UI
│   │   ├── ChapterDetailPage.tsx # Single chapter vocabulary view
│   │   ├── ChaptersPage.tsx    # All chapters grid & progress overview
│   │   ├── DeckDetailPage.tsx  # Deck card manager and study launcher
│   │   ├── DecksPage.tsx       # Custom decks list & creation
│   │   ├── HomePage.tsx        # Dashboard, daily stats, and quick actions
│   │   ├── SearchPage.tsx      # Comprehensive dictionary search & filters
│   │   └── StudyPage.tsx       # Active flashcard study session
│   ├── stores/
│   │   ├── accountStore.ts     # PIN cloud sync & auto-push state
│   │   ├── dataStore.ts        # 53-chapter data loader & community overrides
│   │   ├── deckStore.ts        # Custom decks and cards with local persistence
│   │   └── userStore.ts        # Study progress, favorites, and settings
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces and grammar schemas
│   ├── App.tsx                 # Route declarations
│   ├── index.css               # Tailwind CSS v4 directives
│   └── main.tsx                # React root entry point
├── supabase/
│   └── schema.sql              # Idempotent PostgreSQL schema and RPCs
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 License & Acknowledgments

- **Curriculum:** Vocabulary structured according to the *Oxford Latin Course (College Edition)* by Maurice Balme and James Morwood.
- **External Lexicons:** Gratitude to [Vocabula.lat](https://vocabula.lat), [Latin-is-Simple](https://www.latin-is-simple.com), and [Cactus2000](https://latin.cactus2000.de) for providing reference dictionaries and conjugation tools.
- **Open Source:** Licensed under the [MIT License](LICENSE).
