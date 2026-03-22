# 📚 Interactive Bookmarks Preview

A beautiful, interactive web application to visualize and explore your HTML bookmarks — organized into curated categories with an Obsidian-style graph view.

**🌐 [Live Demo](https://niranjanxprt.github.io/bookmark-preview/)** · **📊 807 Bookmarks** · **🏷️ 14 Categories** · **📱 Mobile Friendly**

---

## ✨ Features

- **Folder-Based Categories**: Parses your browser's existing folder structure directly — no keyword guessing
- **Interactive Grid View**: Clean card-based layout with real-time search and category filtering
- **Obsidian-Style Graph**: Dark force-directed network graph with glowing nodes, hover-highlight, and zoom controls
- **Responsive Design**: Works on desktop and mobile
- **GitHub Pages Ready**: Pure static files — no build step required

## 🌐 Live Demo

### **[View Live Demo →](https://niranjanxprt.github.io/bookmark-preview/)**

---

## 🏷️ Categories

| # | Category | Description |
|---|----------|-------------|
| 1 | 🤖 AI & LLM Tools | ChatGPT, Claude, Perplexity, Gemini, prompt engineering |
| 2 | ⚙️ AI Dev & Infrastructure | LangChain, Langfuse, vector DBs, AI pipelines |
| 3 | 📡 MCP & Agents | Model Context Protocol, agentic frameworks |
| 4 | 🐍 Python & Data Engineering | FastAPI, pandas, Jupyter, data tools |
| 5 | 💻 Web Dev & Frontend | React, Next.js, TypeScript, Tailwind |
| 6 | 🛠️ Dev Tools & Utilities | VS Code, CLI tools, productivity, GitHub |
| 7 | ☁️ Cloud & DevOps | AWS, Docker, Kubernetes, Terraform |
| 8 | 🔐 Security & Compliance | Auth, OAuth, OWASP, cybersecurity |
| 9 | 📚 Learning & Courses | Tutorials, courses, documentation |
| 10 | 💼 Interview & Career | LeetCode, system design, job prep |
| 11 | 🎨 Design & UI Inspiration | Figma, Dribbble, CSS inspiration |
| 12 | 🚀 Startups, Berlin & Ecosystem | Berlin tech scene, startup resources |
| 13 | 🌱 Energy & Sustainability | Green tech, renewable energy |
| 14 | 🎵 Music, Fun & Misc | Spotify, entertainment, miscellaneous |

---

## 🛠️ Setup

### 1. Export & organize your bookmarks

Export bookmarks from Chrome/Firefox/Edge as HTML. Optionally organize them into named folders in your browser before exporting — those folder names become your categories.

### 2. Run the parser locally

```bash
# Folder-based (recommended) — uses H3 folder names as categories
python3 parser.py /path/to/your/bookmarks.html

# Keyword-based (legacy) — auto-assigns categories by URL/title keywords
python3 parser.py --keyword /path/to/your/bookmarks.html
```

This generates `bookmarks_data.json` in the current directory.

### 3. Local development

```bash
# Python built-in server
python3 -m http.server 8000

# Or with Node.js
npx http-server

# Or with live-server (auto-reload)
npx live-server
```

Open `http://localhost:8000` in your browser.

### 4. Deploy to GitHub Pages

1. Push all files to your GitHub repository (`main` branch)
2. Go to **Settings → Pages**
3. Set **Source** → "Deploy from a branch", branch: `main`, folder: `/`
4. Save — your site will be live at `https://your-username.github.io/repo-name`

> **Updating bookmarks**: re-run `parser.py`, commit the updated `bookmarks_data.json`, and push. GitHub Pages redeploys automatically.

---

## 🕸️ Graph View

The Obsidian-style graph is powered by D3.js v7:

- **Dark canvas** with dot-grid background (`#0d1117`)
- **Glowing nodes** — sized by bookmark count, colored by category
- **Hover** a category node → connected bookmarks highlight, others dim
- **Click** a category node → switches to grid filtered to that category
- **Click** a bookmark node → opens URL in new tab
- **Drag** nodes to reposition
- **Controls**: ⊕ Zoom In · ⊖ Zoom Out · ⊞ Fit All · ↺ Reset

---

## 📁 File Structure

```
bookmark-preview/
├── index.html              # Main app (no password, no build step)
├── script.js               # Grid + Obsidian graph logic
├── simple-graph.js         # Fallback grid-based graph (no D3 dependency)
├── parser.py               # Bookmark parser (folder-based + keyword modes)
├── bookmarks_data.json     # Pre-generated bookmark data (commit this!)
└── README.md
```

---

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Visualization**: D3.js v7 (force-directed graph with SVG glow filters)
- **Parser**: Python 3 — `html.parser` for folder mode, regex for keyword mode
- **Hosting**: GitHub Pages (static files, zero build process)

---

## 💡 Tips for improving your bookmark view

- **Reduce "Misc"**: If your catch-all folder is huge, re-sort bookmarks in your browser into specific folders, then re-export and re-run the parser
- **Shareable links**: Bookmark specific filtered views by adding `?cat=category` support (contribution welcome)
- **PWA**: Add `manifest.json` + service worker to make it installable on mobile
- **Custom domain**: Add a `CNAME` file with your domain and configure DNS in GitHub Pages settings

---

## 📝 License

MIT License — feel free to use and modify.
