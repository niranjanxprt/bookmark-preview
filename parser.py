#!/usr/bin/env python3
"""
Bookmark parser — reads a Netscape HTML bookmarks export and produces bookmarks_data.json.

Supports two modes:
  1. Folder-based (default): uses the H3 folder structure as categories.
     Pass a file where bookmarks are already organized into named folders.
  2. Keyword-based (--keyword): uses weighted keyword scoring to assign categories.
"""
import re
import json
import argparse
from urllib.parse import urlparse
from collections import defaultdict
from html.parser import HTMLParser
import html

SKIP_FOLDERS = {
    'Bookmarks Bar', 'Bookmarks bar', 'Imported From Chrome',
    'Other Bookmarks', 'Other bookmarks', 'Other', 'Mobile Bookmarks',
}


def get_domain(url):
    try:
        return urlparse(url).netloc
    except Exception:
        return 'unknown'


# ─── Folder-based parser ────────────────────────────────────────────────────

class FolderBookmarkParser(HTMLParser):
    """Parse bookmarks using the H3 folder hierarchy as categories."""

    def __init__(self):
        super().__init__()
        self.bookmarks = []
        self._dl_depth = 0           # current <DL> nesting depth
        self._pending_h3 = None      # H3 text seen since the last <DL> open
        self._folder_at_depth = {}   # depth → category name
        self._in_h3 = False
        self._h3_buf = ''
        self._in_a = False
        self._a_href = ''
        self._a_buf = ''

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'dl':
            self._dl_depth += 1
            if self._pending_h3 is not None and self._pending_h3 not in SKIP_FOLDERS:
                self._folder_at_depth[self._dl_depth] = self._pending_h3
            self._pending_h3 = None
        elif tag == 'h3':
            self._in_h3 = True
            self._h3_buf = ''
        elif tag == 'a':
            self._in_a = True
            self._a_href = html.unescape(attrs_dict.get('href', ''))
            self._a_buf = ''

    def handle_endtag(self, tag):
        if tag == 'dl':
            self._folder_at_depth.pop(self._dl_depth, None)
            self._dl_depth -= 1
        elif tag == 'h3':
            self._in_h3 = False
            self._pending_h3 = self._h3_buf.strip()
        elif tag == 'a':
            if self._in_a and self._a_href and self._a_buf.strip():
                # Find innermost known category
                category = 'Other'
                for depth in sorted(self._folder_at_depth.keys(), reverse=True):
                    category = self._folder_at_depth[depth]
                    break
                self.bookmarks.append({
                    'url': self._a_href,
                    'title': html.unescape(self._a_buf.strip()),
                    'domain': get_domain(self._a_href),
                    'cluster': category,
                })
            self._in_a = False

    def handle_data(self, data):
        if self._in_h3:
            self._h3_buf += data
        elif self._in_a:
            self._a_buf += data


def parse_bookmarks_by_folder(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    parser = FolderBookmarkParser()
    parser.feed(content)
    return parser.bookmarks


# ─── Keyword-based parser (legacy) ──────────────────────────────────────────

CATEGORIES = {
    'AI/ML': {
        'strong': ['tensorflow', 'pytorch', 'huggingface', 'langchain', 'openai', 'anthropic',
                   'transformers', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'bert',
                   'neural-network', 'deep-learning', 'machine-learning', 'prompt-engineering',
                   'langfuse', 'ollama', 'hugging face', 'notebooklm', 'perplexity'],
        'medium': ['artificial intelligence', 'embedding', 'nlp', 'computer-vision', 'generative',
                   'diffusion', 'ai-powered', 'ai-agent', 'model-context-protocol', 'mcp'],
        'weak': ['semantic', 'vector'],
    },
    'JavaScript': {
        'strong': ['react', 'nextjs', 'next.js', 'vue', 'vuejs', 'angular', 'svelte', 'remix',
                   'nodejs', 'node.js', 'typescript', 'npm', 'webpack', 'vite', 'bun'],
        'medium': ['javascript', 'frontend', 'fullstack'],
        'weak': [],
    },
    'Python': {
        'strong': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy', 'scikit-learn',
                   'jupyter', 'pydantic', 'uvicorn'],
        'medium': ['python', 'python3', 'pythonic', 'pip'],
        'weak': [],
    },
    'Go': {
        'strong': ['golang', 'golang.org', 'go.dev', 'go-lang', 'goroutine', 'gofiber', 'gin-gonic'],
        'medium': [],
        'weak': [],
    },
    'Rust': {
        'strong': ['rustlang', 'rust-lang', 'cargo', 'crates.io'],
        'medium': ['rust programming'],
        'weak': [],
    },
    'Cloud': {
        'strong': ['aws', 'amazon web services', 'azure', 'gcp', 'google-cloud', 'cloud-native',
                   'terraform', 'pulumi', 'cloudflare', 'vercel', 'netlify'],
        'medium': ['cloud', 'infrastructure-as-code', 'serverless', 'lambda'],
        'weak': ['infrastructure', 'deployment'],
    },
    'DevOps': {
        'strong': ['kubernetes', 'k8s', 'docker', 'helm', 'argocd', 'gitlab-ci', 'github-actions',
                   'circleci', 'jenkins', 'ansible', 'prometheus', 'grafana'],
        'medium': ['ci-cd', 'continuous-integration', 'devops', 'gitops', 'containerization'],
        'weak': ['pipeline', 'automation'],
    },
    'Dev Tools': {
        'strong': ['vscode', 'visual studio code', 'vim', 'neovim', 'jetbrains', 'intellij',
                   'cursor', 'zed editor'],
        'medium': ['cli', 'command-line', 'terminal', 'developer-tools', 'code-review'],
        'weak': ['tool', 'utility', 'productivity'],
    },
    'APIs': {
        'strong': ['graphql', 'rest-api', 'api-gateway', 'grpc', 'swagger', 'openapi', 'postman'],
        'medium': ['api', 'restful', 'microservices'],
        'weak': ['endpoint', 'webhook'],
    },
    'Databases': {
        'strong': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
                   'dynamodb', 'supabase', 'planetscale', 'neon'],
        'medium': ['database', 'sql', 'nosql'],
        'weak': [],
    },
    'Security': {
        'strong': ['oauth', 'jwt', 'authentication', 'authorization', 'encryption', 'owasp',
                   'penetration-testing', 'cybersecurity', 'shodan', 'nmap', 'burp suite'],
        'medium': ['security', 'infosec', 'privacy', 'cryptography'],
        'weak': ['auth', 'ssl', 'tls'],
    },
    'Documentation': {
        'strong': ['tutorial', 'course', 'learning-resources', 'educational', 'awesome-list',
                   'cheat-sheet', 'handbook'],
        'medium': ['documentation', 'docs', 'guide', 'learning', 'resources'],
        'weak': ['reference', 'book'],
    },
    'Web Design': {
        'strong': ['tailwind', 'tailwindcss', 'sass', 'scss', 'figma', 'dribbble'],
        'medium': ['css', 'design-system', 'ui-components'],
        'weak': ['html', 'design'],
    },
    'Work Tools': {
        'strong': ['jira', 'confluence', 'slack', 'microsoft teams', 'notion', 'linear'],
        'medium': ['asana', 'trello', 'monday.com'],
        'weak': ['project management'],
    },
    'BuildingMinds': {
        'strong': ['buildingminds', 'building-minds'],
        'medium': [],
        'weak': [],
    },
    'Microsoft': {
        'strong': ['sharepoint', 'microsoft365', 'office365', 'azure devops', 'power platform',
                   'powerbi', 'power bi'],
        'medium': ['microsoft', 'outlook', 'onedrive'],
        'weak': [],
    },
    'Entertainment': {
        'strong': ['spotify', 'netflix', 'twitch', 'imdb'],
        'medium': ['youtube', 'streaming'],
        'weak': [],
    },
    'Algorithms': {
        'strong': ['algorithm', 'data-structure', 'leetcode', 'hackerrank', 'codewars',
                   'coding-interview', 'big-o', 'algoexpert', 'neetcode'],
        'medium': ['algorithms', 'data structures', 'interview prep'],
        'weak': [],
    },
}


def create_word_regex(keyword):
    escaped = re.escape(keyword)
    return re.compile(r'\b' + escaped + r'\b', re.IGNORECASE)


def categorize_bookmark(url, title):
    url_lower = url.lower()
    title_lower = title.lower()
    domain = get_domain(url).lower()
    all_text = f"{url_lower} {title_lower} {domain}"

    category_scores = {}
    for category, keyword_groups in CATEGORIES.items():
        score = 0
        for keyword in keyword_groups.get('strong', []):
            if create_word_regex(keyword).search(all_text):
                score += 10
        for keyword in keyword_groups.get('medium', []):
            if create_word_regex(keyword).search(all_text):
                score += 5
        for keyword in keyword_groups.get('weak', []):
            if create_word_regex(keyword).search(all_text):
                score += 2
        if score > 0:
            category_scores[category] = score

    best_category = 'Other'
    best_score = 4
    for category, score in category_scores.items():
        if score > best_score:
            best_score = score
            best_category = category
    return best_category


def parse_bookmarks_by_keyword(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    bookmark_pattern = r'<A HREF="([^"]*)"[^>]*>([^<]*)</A>'
    bookmarks = []
    for match in re.finditer(bookmark_pattern, content, re.IGNORECASE):
        url = html.unescape(match.group(1))
        title = html.unescape(match.group(2))
        if url and title:
            bookmarks.append({
                'url': url,
                'title': title,
                'domain': get_domain(url),
                'cluster': categorize_bookmark(url, title),
            })
    return bookmarks


# ─── Shared helpers ──────────────────────────────────────────────────────────

def generate_clusters(bookmarks):
    clusters = defaultdict(list)
    for bookmark in bookmarks:
        clusters[bookmark['cluster']].append(bookmark)
    cluster_data = []
    for cluster_name, items in clusters.items():
        cluster_data.append({
            'name': cluster_name,
            'count': len(items),
            'bookmarks': items,
        })
    cluster_data.sort(key=lambda x: x['count'], reverse=True)
    return cluster_data


def main():
    parser = argparse.ArgumentParser(
        description='Parse an HTML bookmarks export into bookmarks_data.json.'
    )
    parser.add_argument(
        'html_file',
        nargs='?',
        default='../bookmarks_9_23_25.html',
        help='Path to bookmarks HTML export',
    )
    parser.add_argument(
        '--keyword',
        action='store_true',
        help='Use keyword-based categorization instead of folder structure',
    )
    args = parser.parse_args()

    if args.keyword:
        print('Using keyword-based categorization...')
        bookmarks = parse_bookmarks_by_keyword(args.html_file)
    else:
        print('Using folder-based categorization (default)...')
        bookmarks = parse_bookmarks_by_folder(args.html_file)

    clusters = generate_clusters(bookmarks)

    output_data = {
        'total_bookmarks': len(bookmarks),
        'total_clusters': len(clusters),
        'clusters': clusters,
        'all_bookmarks': bookmarks,
    }

    with open('bookmarks_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f'Parsed {len(bookmarks)} bookmarks into {len(clusters)} clusters')
    for cluster in clusters:
        print(f'  {cluster["name"]}: {cluster["count"]} bookmarks')


if __name__ == '__main__':
    main()
