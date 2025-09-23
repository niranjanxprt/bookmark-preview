#!/usr/bin/env python3
import re
import json
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

def categorize_bookmark(url, title):
    """Categorize bookmark based on URL and title"""
    url_lower = url.lower()
    title_lower = title.lower()
    
    # Programming languages and frameworks
    if any(term in url_lower or term in title_lower for term in ['javascript', 'js', 'node', 'npm', 'react', 'vue', 'angular']):
        return 'JavaScript'
    elif any(term in url_lower or term in title_lower for term in ['python', 'django', 'flask', 'fastapi', 'jupyter']):
        return 'Python'
    elif any(term in url_lower or term in title_lower for term in ['java', 'spring', 'kotlin']):
        return 'Java/Kotlin'
    elif any(term in url_lower or term in title_lower for term in ['rust', 'cargo']):
        return 'Rust'
    elif any(term in url_lower or term in title_lower for term in ['go', 'golang']):
        return 'Go'
    elif any(term in url_lower or term in title_lower for term in ['cpp', 'c++', 'cmake']):
        return 'C++'
    elif any(term in url_lower or term in title_lower for term in ['csharp', 'c#', '.net', 'dotnet']):
        return 'C#/.NET'
    elif any(term in url_lower or term in title_lower for term in ['php', 'laravel', 'symfony']):
        return 'PHP'
    elif any(term in url_lower or term in title_lower for term in ['ruby', 'rails']):
        return 'Ruby'
    elif any(term in url_lower or term in title_lower for term in ['swift', 'ios', 'xcode']):
        return 'Swift/iOS'
    
    # Web technologies
    elif any(term in url_lower or term in title_lower for term in ['html', 'css', 'sass', 'scss', 'tailwind']):
        return 'Web Design'
    elif any(term in url_lower or term in title_lower for term in ['api', 'rest', 'graphql', 'postman']):
        return 'APIs'
    
    # DevOps and Cloud
    elif any(term in url_lower or term in title_lower for term in ['docker', 'kubernetes', 'k8s', 'helm']):
        return 'Containers'
    elif any(term in url_lower or term in title_lower for term in ['aws', 'azure', 'gcp', 'cloud', 'terraform']):
        return 'Cloud'
    elif any(term in url_lower or term in title_lower for term in ['ci/cd', 'jenkins', 'github actions', 'gitlab']):
        return 'DevOps'
    
    # Databases
    elif any(term in url_lower or term in title_lower for term in ['mysql', 'postgres', 'mongodb', 'redis', 'database']):
        return 'Databases'
    
    # AI/ML
    elif any(term in url_lower or term in title_lower for term in ['ai', 'machine learning', 'ml', 'tensorflow', 'pytorch', 'openai']):
        return 'AI/ML'
    
    # Development tools
    elif any(term in url_lower or term in title_lower for term in ['git', 'github', 'gitlab', 'vscode', 'vim']):
        return 'Dev Tools'
    elif any(term in url_lower or term in title_lower for term in ['test', 'testing', 'jest', 'cypress', 'selenium']):
        return 'Testing'
    
    # Work/Business tools
    elif any(term in url_lower or term in title_lower for term in ['jira', 'confluence', 'slack', 'teams', 'notion']):
        return 'Work Tools'
    elif any(term in url_lower or term in title_lower for term in ['monday', 'asana', 'trello', 'project']):
        return 'Project Management'
    
    # Documentation and learning
    elif any(term in url_lower or term in title_lower for term in ['docs', 'documentation', 'tutorial', 'learn']):
        return 'Documentation'
    elif any(term in url_lower or term in title_lower for term in ['stackoverflow', 'medium', 'dev.to', 'blog']):
        return 'Learning'
    
    # Company/Work specific (based on your bookmarks)
    elif 'buildingminds' in url_lower or 'bm' in title_lower:
        return 'BuildingMinds'
    elif 'personio' in url_lower:
        return 'HR/Admin'
    elif 'sharepoint' in url_lower or 'azure' in url_lower:
        return 'Microsoft'
    
    # Entertainment
    elif any(term in url_lower or term in title_lower for term in ['spotify', 'youtube', 'netflix']):
        return 'Entertainment'
    
    # Default category
    else:
        return 'Other'

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
    # Parse bookmarks
    bookmarks = parse_bookmarks('../bookmarks_9_23_25.html')
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