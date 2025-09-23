# 📚 Interactive Bookmarks Preview

A beautiful, interactive web application to visualize and explore your HTML bookmarks with intelligent clustering by programming languages and topics.

## ✨ Features

- **Smart Clustering**: Automatically categorizes bookmarks by programming languages, frameworks, and topics
- **Interactive Grid View**: Clean card-based layout with search and filtering
- **Graph Visualization**: Network graph showing relationships between categories and bookmarks
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **GitHub Pages Ready**: Easy deployment to GitHub Pages

## 🚀 Live Demo

[View Live Demo](https://your-username.github.io/bookmark-preview) *(Replace with your actual GitHub Pages URL)*

## 📸 Screenshots

### Grid View
The main interface showing bookmarks organized in a clean grid layout with category filtering.

### Graph View
Interactive network visualization showing relationships between bookmark categories.

## 🛠️ Setup

### 1. Parse Your Bookmarks

First, export your bookmarks from your browser as an HTML file, then run the parser:

```bash
# Place your bookmarks HTML file in the parent directory
# Name it 'bookmarks_9_23_25.html' or update the path in parser.py

python3 parser.py
```

This will generate `bookmarks_data.json` with your parsed and clustered bookmarks.

### 2. Local Development

Simply serve the files using any web server:

```bash
# Using Python's built-in server
python3 -m http.server 8000

# Using Node.js http-server
npx http-server

# Using live-server for auto-reload
npx live-server
```

Then open http://localhost:8000 in your browser.

### 3. Deploy to GitHub Pages

1. **Create a new repository** on GitHub
2. **Upload all files** to the repository:
   - `index.html`
   - `script.js`
   - `bookmarks_data.json`
   - `README.md` (optional)

3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / master
   - Folder: / (root)
   - Save

4. **Access your site** at: `https://your-username.github.io/repository-name`

## 📊 Bookmark Categories

The parser automatically categorizes bookmarks into these clusters:

### Programming Languages
- JavaScript (React, Vue, Node.js, etc.)
- Python (Django, Flask, FastAPI, etc.)
- Java/Kotlin
- Go
- Rust
- C++
- C#/.NET
- PHP
- Ruby
- Swift/iOS

### Technologies & Tools
- Web Design (HTML, CSS, Tailwind)
- APIs (REST, GraphQL)
- Containers (Docker, Kubernetes)
- Cloud (AWS, Azure, GCP)
- DevOps (CI/CD, Jenkins)
- Databases (MySQL, PostgreSQL, MongoDB)
- AI/ML (TensorFlow, PyTorch, OpenAI)

### Work & Learning
- Dev Tools (Git, VS Code, IDEs)
- Testing (Jest, Cypress, Selenium)
- Work Tools (Jira, Slack, Teams)
- Project Management (Monday, Asana)
- Documentation & Learning

## 🎨 Customization

### Adding New Categories

Edit the `categorize_bookmark()` function in `parser.py` to add new categorization rules:

```python
elif any(term in url_lower or term in title_lower for term in ['your', 'keywords']):
    return 'Your Category'
```

### Styling

Modify the CSS in `index.html` to customize colors, layout, and animations.

### Icons

Update the `getClusterIcon()` function in `script.js` to change category icons.

## 🔧 Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Visualization**: D3.js for graph view
- **Parser**: Python 3 with regex and URL parsing
- **Hosting**: GitHub Pages compatible (static files only)

## 📁 File Structure

```
bookmark-preview/
├── index.html          # Main HTML file
├── script.js           # JavaScript functionality
├── parser.py           # Python bookmark parser
├── bookmarks_data.json # Generated bookmark data
└── README.md           # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - feel free to use and modify as needed.

## 🐛 Troubleshooting

### Parser Issues
- Ensure your bookmarks HTML file path is correct
- Check that Python 3 is installed
- Verify the HTML file is a valid Netscape bookmark format

### GitHub Pages Issues
- Ensure all files are in the root directory
- Check that `bookmarks_data.json` is properly generated
- Verify GitHub Pages is enabled in repository settings

### Performance
- For large bookmark collections (>1000), consider sampling in the graph view
- The grid view can handle thousands of bookmarks efficiently