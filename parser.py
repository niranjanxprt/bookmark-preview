#!/usr/bin/env python3
import re
import json
import argparse
from urllib.parse import urlparse
from collections import defaultdict
import html

def parse_bookmarks(html_file):
    """Parse HTML bookmarks file and extract bookmark data"""
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all bookmark entries
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
                'cluster': categorize_bookmark(url, title)
            })
    
    return bookmarks

def get_domain(url):
    """Extract domain from URL"""
    try:
        return urlparse(url).netloc
    except:
        return 'unknown'

# Enhanced category definitions with weighted keyword scoring
# Based on best practices from starred-repos-graph
CATEGORIES = {
    'AI/ML': {
        'strong': ['tensorflow', 'pytorch', 'huggingface', 'langchain', 'openai', 'anthropic',
                   'transformers', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'bert',
                   'neural-network', 'deep-learning', 'machine-learning', 'prompt-engineering',
                   'langfuse', 'ollama', 'hugging face', 'notebooklm', 'perplexity'],
        'medium': ['artificial intelligence', 'embedding', 'nlp', 'computer-vision', 'generative',
                   'diffusion', 'ai-powered', 'ai-agent', 'model-context-protocol', 'mcp'],
        'weak': ['semantic', 'vector']
    },
    'JavaScript': {
        'strong': ['react', 'nextjs', 'next.js', 'vue', 'vuejs', 'angular', 'svelte', 'remix',
                   'nodejs', 'node.js', 'typescript', 'npm', 'webpack', 'vite', 'bun'],
        'medium': ['javascript', 'frontend', 'fullstack'],
        'weak': []
    },
    'Python': {
        'strong': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy', 'scikit-learn',
                   'jupyter', 'pydantic', 'uvicorn'],
        'medium': ['python', 'python3', 'pythonic', 'pip'],
        'weak': []
    },
    'Go': {
        'strong': ['golang', 'golang.org', 'go.dev', 'go-lang', 'goroutine', 'gofiber', 'gin-gonic'],
        'medium': [],
        'weak': []
    },
    'Rust': {
        'strong': ['rustlang', 'rust-lang', 'cargo', 'crates.io'],
        'medium': ['rust programming'],
        'weak': []
    },
    'Cloud': {
        'strong': ['aws', 'amazon web services', 'azure', 'gcp', 'google-cloud', 'cloud-native',
                   'terraform', 'pulumi', 'cloudflare', 'vercel', 'netlify'],
        'medium': ['cloud', 'infrastructure-as-code', 'serverless', 'lambda'],
        'weak': ['infrastructure', 'deployment']
    },
    'DevOps': {
        'strong': ['kubernetes', 'k8s', 'docker', 'helm', 'argocd', 'gitlab-ci', 'github-actions',
                   'circleci', 'jenkins', 'ansible', 'prometheus', 'grafana'],
        'medium': ['ci-cd', 'continuous-integration', 'devops', 'gitops', 'containerization'],
        'weak': ['pipeline', 'automation']
    },
    'Dev Tools': {
        'strong': ['vscode', 'visual studio code', 'vim', 'neovim', 'jetbrains', 'intellij',
                   'cursor', 'zed editor'],
        'medium': ['cli', 'command-line', 'terminal', 'developer-tools', 'code-review'],
        'weak': ['tool', 'utility', 'productivity']
    },
    'APIs': {
        'strong': ['graphql', 'rest-api', 'api-gateway', 'grpc', 'swagger', 'openapi', 'postman'],
        'medium': ['api', 'restful', 'microservices'],
        'weak': ['endpoint', 'webhook']
    },
    'Databases': {
        'strong': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
                   'dynamodb', 'supabase', 'planetscale', 'neon'],
        'medium': ['database', 'sql', 'nosql'],
        'weak': []
    },
    'Security': {
        'strong': ['oauth', 'jwt', 'authentication', 'authorization', 'encryption', 'owasp',
                   'penetration-testing', 'cybersecurity', 'shodan', 'nmap', 'burp suite'],
        'medium': ['security', 'infosec', 'privacy', 'cryptography'],
        'weak': ['auth', 'ssl', 'tls']
    },
    'Documentation': {
        'strong': ['tutorial', 'course', 'learning-resources', 'educational', 'awesome-list',
                   'cheat-sheet', 'handbook'],
        'medium': ['documentation', 'docs', 'guide', 'learning', 'resources'],
        'weak': ['reference', 'book']
    },
    'Web Design': {
        'strong': ['tailwind', 'tailwindcss', 'sass', 'scss', 'figma', 'dribbble'],
        'medium': ['css', 'design-system', 'ui-components'],
        'weak': ['html', 'design']
    },
    'Work Tools': {
        'strong': ['jira', 'confluence', 'slack', 'microsoft teams', 'notion', 'linear'],
        'medium': ['asana', 'trello', 'monday.com'],
        'weak': ['project management']
    },
    'BuildingMinds': {
        'strong': ['buildingminds', 'building-minds'],
        'medium': [],
        'weak': []
    },
    'Microsoft': {
        'strong': ['sharepoint', 'microsoft365', 'office365', 'azure devops', 'power platform',
                   'powerbi', 'power bi'],
        'medium': ['microsoft', 'outlook', 'onedrive'],
        'weak': []
    },
    'Entertainment': {
        'strong': ['spotify', 'netflix', 'twitch', 'imdb'],
        'medium': ['youtube', 'streaming'],
        'weak': []
    },
    'Algorithms': {
        'strong': ['algorithm', 'data-structure', 'leetcode', 'hackerrank', 'codewars',
                   'coding-interview', 'big-o', 'algoexpert', 'neetcode'],
        'medium': ['algorithms', 'data structures', 'interview prep'],
        'weak': []
    }
}

def create_word_regex(keyword):
    """Create word boundary regex for precise matching"""
    escaped = re.escape(keyword)
    return re.compile(r'\b' + escaped + r'\b', re.IGNORECASE)

def categorize_bookmark(url, title):
    """Categorize bookmark using weighted keyword scoring"""
    url_lower = url.lower()
    title_lower = title.lower()
    domain = get_domain(url).lower()

    # Combine all text for matching
    all_text = f"{url_lower} {title_lower} {domain}"

    # Score each category
    category_scores = {}

    for category, keyword_groups in CATEGORIES.items():
        score = 0

        # Strong keywords: 10 points
        for keyword in keyword_groups.get('strong', []):
            if create_word_regex(keyword).search(all_text):
                score += 10

        # Medium keywords: 5 points
        for keyword in keyword_groups.get('medium', []):
            if create_word_regex(keyword).search(all_text):
                score += 5

        # Weak keywords: 2 points
        for keyword in keyword_groups.get('weak', []):
            if create_word_regex(keyword).search(all_text):
                score += 2

        if score > 0:
            category_scores[category] = score

    # Find category with highest score (minimum threshold: 4 points)
    best_category = 'Other'
    best_score = 4

    for category, score in category_scores.items():
        if score > best_score:
            best_score = score
            best_category = category

    return best_category

def generate_clusters(bookmarks):
    """Generate cluster data with statistics"""
    clusters = defaultdict(list)
    
    for bookmark in bookmarks:
        clusters[bookmark['cluster']].append(bookmark)
    
    # Convert to list with metadata
    cluster_data = []
    for cluster_name, items in clusters.items():
        cluster_data.append({
            'name': cluster_name,
            'count': len(items),
            'bookmarks': items
        })
    
    # Sort by count (descending)
    cluster_data.sort(key=lambda x: x['count'], reverse=True)
    
    return cluster_data

def main():
    parser = argparse.ArgumentParser(description='Parse an HTML bookmarks export into JSON.')
    parser.add_argument(
        'html_file',
        nargs='?',
        default='../bookmarks_9_23_25.html',
        help='Path to bookmarks HTML export (default: ../bookmarks_9_23_25.html)'
    )
    args = parser.parse_args()

    # Parse bookmarks
    bookmarks = parse_bookmarks(args.html_file)
    clusters = generate_clusters(bookmarks)
    
    # Generate output data
    output_data = {
        'total_bookmarks': len(bookmarks),
        'total_clusters': len(clusters),
        'clusters': clusters,
        'all_bookmarks': bookmarks
    }
    
    # Save to JSON
    with open('bookmarks_data.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"Parsed {len(bookmarks)} bookmarks into {len(clusters)} clusters")
    for cluster in clusters[:10]:  # Show top 10 clusters
        print(f"  {cluster['name']}: {cluster['count']} bookmarks")

if __name__ == '__main__':
    main()
