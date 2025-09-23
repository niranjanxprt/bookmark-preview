// Global state
let bookmarksData = null;
let filteredBookmarks = [];
let currentCluster = 'all';

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadBookmarksData();
        setupEventListeners();
        renderClusters();
        renderBookmarks();
        updateStats();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load bookmarks data');
    }
});

// Load bookmarks data
async function loadBookmarksData() {
    try {
        const response = await fetch('bookmarks_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        bookmarksData = await response.json();
        filteredBookmarks = bookmarksData.all_bookmarks;
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {
    // View toggle buttons
    document.getElementById('grid-view').addEventListener('click', () => switchView('grid'));
    document.getElementById('graph-view').addEventListener('click', () => switchView('graph'));
    
    // Search functionality
    const searchBox = document.getElementById('search');
    searchBox.addEventListener('input', debounce(handleSearch, 300));
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredBookmarks = currentCluster === 'all' 
            ? bookmarksData.all_bookmarks 
            : bookmarksData.clusters.find(c => c.name === currentCluster)?.bookmarks || [];
    } else {
        const sourceBookmarks = currentCluster === 'all' 
            ? bookmarksData.all_bookmarks 
            : bookmarksData.clusters.find(c => c.name === currentCluster)?.bookmarks || [];
            
        filteredBookmarks = sourceBookmarks.filter(bookmark => 
            bookmark.title.toLowerCase().includes(searchTerm) ||
            bookmark.url.toLowerCase().includes(searchTerm) ||
            bookmark.cluster.toLowerCase().includes(searchTerm)
        );
    }
    
    renderBookmarks();
    updateStats();
}

// Switch between views
function switchView(viewType) {
    const gridBtn = document.getElementById('grid-view');
    const graphBtn = document.getElementById('graph-view');
    const gridContainer = document.getElementById('grid-container');
    const graphContainer = document.getElementById('graph-container');
    
    if (viewType === 'grid') {
        gridBtn.classList.add('active');
        graphBtn.classList.remove('active');
        gridContainer.style.display = 'block';
        graphContainer.style.display = 'none';
    } else {
        gridBtn.classList.remove('active');
        graphBtn.classList.add('active');
        gridContainer.style.display = 'none';
        graphContainer.style.display = 'block';
        
        // Try D3.js graph first, fallback to simple graph
        try {
            if (typeof d3 !== 'undefined') {
                renderGraph();
            } else {
                renderSimpleGraph();
            }
        } catch (error) {
            console.error('Graph rendering failed:', error);
            renderSimpleGraph();
        }
    }
}

// Render cluster list
function renderClusters() {
    const clusterList = document.getElementById('cluster-list');
    
    const allItem = document.createElement('li');
    allItem.className = 'cluster-item active';
    allItem.innerHTML = `
        <div class="cluster-name">All Bookmarks</div>
        <div class="cluster-count">${bookmarksData.total_bookmarks} bookmarks</div>
    `;
    allItem.addEventListener('click', () => selectCluster('all', allItem));
    
    clusterList.innerHTML = '';
    clusterList.appendChild(allItem);
    
    bookmarksData.clusters.forEach(cluster => {
        const item = document.createElement('li');
        item.className = 'cluster-item';
        const percentage = (cluster.count / bookmarksData.total_bookmarks * 100).toFixed(1);
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="cluster-name">${getClusterIcon(cluster.name)} ${cluster.name}</div>
                    <div class="cluster-count">${cluster.count} bookmarks (${percentage}%)</div>
                </div>
                <button onclick="event.stopPropagation(); showClusterInfo('${cluster.name}')" 
                        style="background: #e5e7eb; border: none; border-radius: 4px; padding: 4px 6px; 
                               cursor: pointer; font-size: 10px; color: #6b7280;"
                        title="View all bookmarks in this category">ℹ️</button>
            </div>
        `;
        item.addEventListener('click', () => selectCluster(cluster.name, item));
        clusterList.appendChild(item);
    });
}

// Select a cluster
function selectCluster(clusterName, element) {
    // Update active state
    document.querySelectorAll('.cluster-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    // Update current cluster
    currentCluster = clusterName;
    
    // Filter bookmarks
    if (clusterName === 'all') {
        filteredBookmarks = bookmarksData.all_bookmarks;
    } else {
        const cluster = bookmarksData.clusters.find(c => c.name === clusterName);
        filteredBookmarks = cluster ? cluster.bookmarks : [];
    }
    
    // Clear search
    document.getElementById('search').value = '';
    
    // Re-render
    renderBookmarks();
    updateStats();
}

// Render bookmarks grid
function renderBookmarks() {
    const grid = document.getElementById('bookmarks-grid');
    
    if (filteredBookmarks.length === 0) {
        grid.innerHTML = '<div class="loading">No bookmarks found</div>';
        return;
    }
    
    grid.innerHTML = '';
    
    filteredBookmarks.forEach(bookmark => {
        const card = document.createElement('div');
        card.className = 'bookmark-card';
        
        const icon = getClusterIcon(bookmark.cluster);
        
        card.innerHTML = `
            <div class="bookmark-header">
                <div class="bookmark-icon">${icon}</div>
                <a href="${bookmark.url}" target="_blank" class="bookmark-title" title="${bookmark.title}">
                    ${truncateText(bookmark.title, 40)}
                </a>
            </div>
            <div class="bookmark-url" title="${bookmark.url}">${bookmark.domain}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div class="bookmark-cluster">${bookmark.cluster}</div>
                <button onclick="event.preventDefault(); copyToClipboard('${bookmark.url}', this)" 
                        style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; 
                               padding: 4px 8px; font-size: 10px; cursor: pointer; color: #6b7280;"
                        title="Copy URL to clipboard">📋</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Get icon for cluster
function getClusterIcon(cluster) {
    const icons = {
        'JavaScript': '🟨',
        'Python': '🐍',
        'Java/Kotlin': '☕',
        'Rust': '🦀',
        'Go': '🐹',
        'C++': '⚡',
        'C#/.NET': '🔷',
        'PHP': '🐘',
        'Ruby': '💎',
        'Swift/iOS': '🍎',
        'Web Design': '🎨',
        'APIs': '🔌',
        'Containers': '📦',
        'Cloud': '☁️',
        'DevOps': '⚙️',
        'Databases': '🗄️',
        'AI/ML': '🤖',
        'Dev Tools': '🔧',
        'Testing': '🧪',
        'Work Tools': '💼',
        'Project Management': '📊',
        'Documentation': '📖',
        'Learning': '🎓',
        'BuildingMinds': '🏢',
        'HR/Admin': '👥',
        'Microsoft': '🪟',
        'Entertainment': '🎭',
        'Other': '📌'
    };
    return icons[cluster] || '📌';
}

// Truncate text
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Update stats
function updateStats() {
    const stats = document.getElementById('stats');
    const total = filteredBookmarks.length;
    const clusterText = currentCluster === 'all' ? 'all categories' : currentCluster;
    stats.textContent = `Showing ${total} bookmarks in ${clusterText}`;
}

// Render graph visualization
function renderGraph() {
    const container = document.getElementById('graph-container');
    container.innerHTML = '';
    
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        container.innerHTML = '<div class="loading" style="color: #ef4444;">D3.js failed to load. Graph view requires internet connection.</div>';
        return;
    }
    
    // Check if data is loaded
    if (!bookmarksData || !bookmarksData.clusters) {
        container.innerHTML = '<div class="loading" style="color: #ef4444;">Bookmark data not loaded yet. Please wait...</div>';
        return;
    }
    
    console.log('Rendering graph with', bookmarksData.clusters.length, 'clusters');
    
    // Create a larger canvas for scrolling
    const containerWidth = container.clientWidth || 800;
    const containerHeight = 600;
    const width = Math.max(containerWidth, 1200); // Ensure minimum width for scrolling
    const height = Math.max(containerHeight, 800); // Ensure minimum height for scrolling
    
    // Add loading message
    container.innerHTML = '<div class="loading">Generating network graph...</div>';
    
    const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#f8fafc')
        .style('border-radius', '8px')
        .style('display', 'block');
    
    // Create a main group for all elements that will be affected by zoom/pan
    const mainGroup = svg.append('g');
    
    // Add zoom functionality
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', function(event) {
            const { transform } = event;
            mainGroup.attr('transform', transform);
        });
    
    svg.call(zoom);
    
    // Create nodes and links
    const nodes = [];
    const links = [];
    
    // Add cluster nodes
    bookmarksData.clusters.forEach(cluster => {
        nodes.push({
            id: cluster.name,
            type: 'cluster',
            count: cluster.count,
            radius: Math.max(15, Math.min(40, Math.sqrt(cluster.count) * 3))
        });
    });
    
    // Add fewer bookmark nodes for better performance and visibility
    const maxBookmarksPerCluster = 3;
    bookmarksData.clusters.forEach(cluster => {
        const sampleBookmarks = cluster.bookmarks.slice(0, maxBookmarksPerCluster);
        sampleBookmarks.forEach((bookmark, index) => {
            const nodeId = `${cluster.name}-bookmark-${index}`;
            nodes.push({
                id: nodeId,
                type: 'bookmark',
                title: bookmark.title,
                cluster: bookmark.cluster,
                url: bookmark.url,
                radius: 6
            });
            
            links.push({
                source: cluster.name,
                target: nodeId
            });
        });
    });
    
    // Create simulation with better parameters
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(80).strength(0.5))
        .force('charge', d3.forceManyBody().strength(d => d.type === 'cluster' ? -500 : -100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 5));
    
    // Create links
    const link = mainGroup.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1);
    
    // Create nodes with better colors for all categories
    const clusterColors = {
        'JavaScript': '#f7df1e', 'Python': '#3776ab', 'Java/Kotlin': '#ed8b00',
        'Go': '#00add8', 'Rust': '#ce422b', 'AI/ML': '#ff6b6b', 'Cloud': '#4ecdc4',
        'BuildingMinds': '#1a73e8', 'APIs': '#34a853', 'Dev Tools': '#ea4335',
        'Documentation': '#9c27b0', 'Learning': '#ff9800', 'Testing': '#607d8b',
        'Databases': '#795548', 'Web Design': '#e91e63', 'Containers': '#00bcd4',
        'DevOps': '#ffeb3b', 'Work Tools': '#673ab7', 'Project Management': '#009688',
        'Other': '#95a5a6', 'Entertainment': '#f44336', 'Microsoft': '#0078d4'
    };
    
    const node = mainGroup.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => {
            if (d.type === 'cluster') {
                return clusterColors[d.id] || '#4f46e5';
            } else {
                return clusterColors[d.cluster] || '#10b981';
            }
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add labels for clusters
    const labels = mainGroup.append('g')
        .selectAll('text')
        .data(nodes.filter(d => d.type === 'cluster'))
        .join('text')
        .text(d => d.id)
        .attr('font-size', 12)
        .attr('font-family', 'Arial, sans-serif')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('fill', '#333');
    
    // Add tooltips and click events
    node.append('title')
        .text(d => d.type === 'cluster' 
            ? `${d.id}: ${d.count} bookmarks (click to filter)`
            : `${d.title}\nCluster: ${d.cluster}\nURL: ${d.url}`);
    
    // Add click events to cluster nodes
    node.filter(d => d.type === 'cluster')
        .on('click', function(event, d) {
            // Find the cluster in sidebar and select it
            const clusterItems = document.querySelectorAll('.cluster-item');
            clusterItems.forEach(item => {
                if (item.textContent.includes(d.id)) {
                    item.click();
                    // Switch to grid view to see results
                    document.getElementById('grid-view').click();
                    // Scroll to top of grid view for better UX
                    document.getElementById('grid-container').scrollTop = 0;
                }
            });
        })
        .style('cursor', 'pointer');
    
    // Add click events to bookmark nodes to open URLs
    node.filter(d => d.type === 'bookmark')
        .on('click', function(event, d) {
            event.preventDefault();
            if (d.url) {
                window.open(d.url, '_blank');
            }
        })
        .style('cursor', 'pointer');
    
    // Add navigation instructions and overview (fixed position, not affected by zoom)
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', 14)
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(`Network Graph: ${bookmarksData.clusters.length} Categories, ${bookmarksData.total_bookmarks} Bookmarks`);
    
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', '#666')
        .text('🖱️ Drag nodes • 🖱️ Click categories • ↕️↔️ Scroll/Pan • 🔍 Mouse wheel to zoom');
        
    // Add a subtle border to show the full canvas area
    mainGroup.append('rect')
        .attr('x', 2)
        .attr('y', 2)
        .attr('width', width - 4)
        .attr('height', height - 4)
        .attr('fill', 'none')
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.3);
    
    // Update positions
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Copy URL to clipboard
function copyToClipboard(url, button) {
    navigator.clipboard.writeText(url).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓';
        button.style.background = '#dcfce7';
        button.style.color = '#166534';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#f3f4f6';
            button.style.color = '#6b7280';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalText = button.textContent;
        button.textContent = '✓';
        button.style.background = '#dcfce7';
        button.style.color = '#166534';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#f3f4f6';
            button.style.color = '#6b7280';
        }, 2000);
    });
}

// Show error message
function showError(message) {
    const grid = document.getElementById('bookmarks-grid');
    grid.innerHTML = `<div class="loading" style="color: #ef4444;">${message}</div>`;
}