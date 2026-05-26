# 🚀 Deploying NKT Nedumpurath Hub & Spoke to Vercel Hosting

This application is fully optimized to be deployed on **Vercel** as a full-stack, high-performance platform. It is configured to run Vite dynamically at the edge as a Single Page Application (SPA), while proxying all backend Express requests (`/api/*`) through Vercel's Serverless Node.js Functions.

---

## 🏗️ Deployment Architecture

We have provisioned your codebase with structural configuration assets specifically for Vercel:
1. **`vercel.json`**: Configures rewrites so that `/api/*` traffic goes to your serverled controller, and all other frontend routes default to the built Single Page App (`index.html`) allowing clean, client-side React driving.
2. **`/api/index.ts`**: The unified serverless function entrypoint. It imports your complete structured Express backend and serves routing pipelines at Vercel's serverless edge.
3. **`server.ts`**: Specially updated with dynamic environment sensing. If `process.env.VERCEL` is active, it skips booting local listener processes to prevent timeouts while exporting core routes safely.

---

## 🛠️ Step-by-Step Vercel Deployment

Follow this streamlined workflow to host your application on your personal Vercel dashboard:

### 1. Push or Export Code to GitHub
Ensure your code is stored in a GitHub repository:
- Use the **Settings** menu at the top-right of the AI Studio workspace.
- Choose **Export to GitHub** (or download the ZIP file and push it to a clean repository).

### 2. Import Workspace to Vercel
- Log into your [Vercel Dashboard](https://vercel.com).
- Click **Add New** ➔ **Project**.
- Select the exported GitHub repository to import.

### 3. Setup Project Properties
Vercel's Zero-Config engine will automatically detect your file hierarchy. Ensure the following defaults are configured:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (Root)
- **Build Command**: `vite build` *(Since Vercel handles serverless backend compilation automatically, we only compile frontend static assets inside this step!)*
- **Output Directory**: `dist`

### 4. Inject Environment Variables 🔑
Before hitting **Deploy**, populate your secrets inside the **Environment Variables** accordion:

| Variable Name | Description | Suggested Value |
| :--- | :--- | :--- |
| **`GEMINI_API_KEY`** | Credentials required by our secure server assistant proxy. | *Your private Gemini API key from AI Studio* |
| **`NODE_ENV`** | Sets Node's operational runtime flags. | `production` |

### 5. Deploy!
- Click **Deploy**. Vercel will bundle your assets, verify Serverless Functions, and give you a beautiful live operational domain (e.g. `https://your-nkt-app.vercel.app`) in under a minute!

---

## 💾 Persistency Disclaimer
Your Express serverless controller handles leads in-memory and attempts write fallbacks, but serverless environments are inherently **stateless & read-only**.
- If your users submit leads, they will save correctly during the lambda execution lifespan.
- For long-term production persistence, we recommend integrating standard server-side cloud databases such as **Firebase Firestore** or **Supabase / PostgreSQL**, which scale effortlessly alongside Vercel's edge functions!
