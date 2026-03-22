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
    document.getElementById('grid-view').addEventListener('click', () => switchView('grid'));
    document.getElementById('graph-view').addEventListener('click', () => switchView('graph'));
    const searchBox = document.getElementById('search');
    searchBox.addEventListener('input', debounce(handleSearch, 300));
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
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
        const source = currentCluster === 'all'
            ? bookmarksData.all_bookmarks
            : bookmarksData.clusters.find(c => c.name === currentCluster)?.bookmarks || [];
        filteredBookmarks = source.filter(b =>
            b.title.toLowerCase().includes(searchTerm) ||
            b.url.toLowerCase().includes(searchTerm) ||
            b.cluster.toLowerCase().includes(searchTerm)
        );
    }
    renderBookmarks();
    updateStats();
}

// Switch views
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

// Render cluster sidebar list
function renderClusters() {
    const clusterList = document.getElementById('cluster-list');
    clusterList.innerHTML = '';

    const allItem = document.createElement('li');
    allItem.className = 'cluster-item active';
    allItem.innerHTML = `
        <div class="cluster-name">🌐 All Bookmarks</div>
        <div class="cluster-count">${bookmarksData.total_bookmarks} bookmarks</div>
    `;
    allItem.addEventListener('click', () => selectCluster('all', allItem));
    clusterList.appendChild(allItem);

    bookmarksData.clusters.forEach(cluster => {
        const item = document.createElement('li');
        item.className = 'cluster-item';
        const percentage = (cluster.count / bookmarksData.total_bookmarks * 100).toFixed(1);
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="cluster-name">${cluster.name}</div>
                    <div class="cluster-count">${cluster.count} bookmarks (${percentage}%)</div>
                </div>
                <button onclick="event.stopPropagation(); showClusterInfo('${cluster.name.replace(/'/g, "\\'")}')"
                        style="background: #e5e7eb; border: none; border-radius: 4px; padding: 4px 6px;
                               cursor: pointer; font-size: 10px; color: #6b7280;"
                        title="View all bookmarks">ℹ️</button>
            </div>
        `;
        item.addEventListener('click', () => selectCluster(cluster.name, item));
        clusterList.appendChild(item);
    });
}

// Select a cluster
function selectCluster(clusterName, element) {
    document.querySelectorAll('.cluster-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    currentCluster = clusterName;

    if (clusterName === 'all') {
        filteredBookmarks = bookmarksData.all_bookmarks;
    } else {
        const cluster = bookmarksData.clusters.find(c => c.name === clusterName);
        filteredBookmarks = cluster ? cluster.bookmarks : [];
    }

    document.getElementById('search').value = '';
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
                    ${truncateText(bookmark.title, 50)}
                </a>
            </div>
            <div class="bookmark-url" title="${bookmark.url}">${bookmark.domain}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <div class="bookmark-cluster">${bookmark.cluster}</div>
                <button onclick="event.preventDefault(); copyToClipboard('${bookmark.url.replace(/'/g, "\\'")}', this)"
                        style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px;
                               padding: 4px 8px; font-size: 10px; cursor: pointer; color: #6b7280;"
                        title="Copy URL">📋</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Extract leading emoji from cluster name, or return a default
function getClusterIcon(cluster) {
    if (!cluster) return '📌';
    const firstChar = [...cluster][0];
    if (firstChar && firstChar.codePointAt(0) > 0x7F) {
        return firstChar;
    }
    // Legacy category fallback
    const icons = {
        'JavaScript': '🟨', 'Python': '🐍', 'Rust': '🦀', 'Go': '🐹',
        'Cloud': '☁️', 'DevOps': '⚙️', 'Databases': '🗄️', 'AI/ML': '🤖',
        'Dev Tools': '🔧', 'Work Tools': '💼', 'Documentation': '📖',
        'Web Design': '🎨', 'APIs': '🔌', 'Security': '🔐',
        'BuildingMinds': '🏢', 'Microsoft': '🪟', 'Entertainment': '🎭',
        'Algorithms': '🧮', 'Other': '📌',
    };
    return icons[cluster] || '📌';
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function updateStats() {
    const stats = document.getElementById('stats');
    const clusterText = currentCluster === 'all' ? 'all categories' : currentCluster;
    stats.textContent = `Showing ${filteredBookmarks.length} bookmarks in ${clusterText}`;
}

// ─── Obsidian-style Graph View ───────────────────────────────────────────────

const CATEGORY_COLORS = {
    '🤖 AI & LLM Tools':             '#ff6b9d',
    '⚙️ AI Dev & Infrastructure':    '#f5c842',
    '📡 MCP & Agents':               '#9b59f5',
    '🐍 Python & Data Engineering':  '#5ba3f5',
    '💻 Web Dev & Frontend':         '#61dafb',
    '🛠️ Dev Tools & Utilities':      '#f97316',
    '☁️ Cloud & DevOps':             '#4ecdc4',
    '🔐 Security & Compliance':      '#ff4757',
    '📚 Learning & Courses':         '#ffd32a',
    '💼 Interview & Career':         '#2ed573',
    '🎨 Design & UI Inspiration':    '#ec4899',
    '🚀 Startups, Berlin & Ecosystem': '#ff7043',
    '🌱 Energy & Sustainability':    '#3ae374',
    '🎵 Music, Fun & Misc':          '#bf55ec',
    // Legacy fallbacks
    'AI/ML': '#ff6b9d', 'JavaScript': '#f7df1e', 'Python': '#5ba3f5',
    'Cloud': '#4ecdc4', 'DevOps': '#f97316', 'Security': '#ff4757',
    'Dev Tools': '#ea4335', 'Documentation': '#f59e0b', 'Web Design': '#ec4899',
    'Work Tools': '#10b981', 'Databases': '#795548', 'APIs': '#34a853',
    'BuildingMinds': '#1a73e8', 'Microsoft': '#0078d4', 'Entertainment': '#f44336',
    'Algorithms': '#9c27b0', 'Other': '#64748b',
};

function getNodeColor(name) {
    return CATEGORY_COLORS[name] || '#a0aec0';
}

function renderGraph() {
    const container = document.getElementById('graph-container');
    container.innerHTML = '';

    if (typeof d3 === 'undefined') {
        renderSimpleGraph();
        return;
    }
    if (!bookmarksData || !bookmarksData.clusters) {
        container.innerHTML = '<div class="loading" style="color:#94a3b8">Loading graph data...</div>';
        return;
    }

    const width = container.clientWidth || 900;
    const height = 680;

    // ── SVG ────────────────────────────────────────────────────────────────
    const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#0d1117')
        .style('border-radius', '8px')
        .style('display', 'block');

    // ── Defs: glow filters + dot-grid pattern ──────────────────────────────
    const defs = svg.append('defs');

    // Cluster node glow
    const glowCluster = defs.append('filter')
        .attr('id', 'glow-cluster')
        .attr('x', '-60%').attr('y', '-60%')
        .attr('width', '220%').attr('height', '220%');
    glowCluster.append('feGaussianBlur').attr('stdDeviation', '7').attr('result', 'blur');
    const mergeC = glowCluster.append('feMerge');
    mergeC.append('feMergeNode').attr('in', 'blur');
    mergeC.append('feMergeNode').attr('in', 'SourceGraphic');

    // Bookmark node glow
    const glowBookmark = defs.append('filter')
        .attr('id', 'glow-bookmark')
        .attr('x', '-80%').attr('y', '-80%')
        .attr('width', '260%').attr('height', '260%');
    glowBookmark.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const mergeB = glowBookmark.append('feMerge');
    mergeB.append('feMergeNode').attr('in', 'blur');
    mergeB.append('feMergeNode').attr('in', 'SourceGraphic');

    // Subtle dot grid background
    const dotPat = defs.append('pattern')
        .attr('id', 'dotgrid').attr('x', 0).attr('y', 0)
        .attr('width', 28).attr('height', 28)
        .attr('patternUnits', 'userSpaceOnUse');
    dotPat.append('circle').attr('cx', 1).attr('cy', 1).attr('r', 0.8).attr('fill', '#1c2333');
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#dotgrid)');

    // ── Build node + link data ──────────────────────────────────────────────
    const nodes = [];
    const links = [];
    const MAX_BOOKMARKS_PER_CLUSTER = 6;

    bookmarksData.clusters.forEach(cluster => {
        const color = getNodeColor(cluster.name);
        nodes.push({
            id: cluster.name,
            type: 'cluster',
            count: cluster.count,
            color,
            radius: Math.max(22, Math.min(52, Math.sqrt(cluster.count) * 4.2)),
        });
        cluster.bookmarks.slice(0, MAX_BOOKMARKS_PER_CLUSTER).forEach((bm, i) => {
            const nodeId = `${cluster.name}::${i}`;
            nodes.push({ id: nodeId, type: 'bookmark', title: bm.title, url: bm.url, cluster: cluster.name, color, radius: 5 });
            links.push({ source: cluster.name, target: nodeId, cluster: cluster.name });
        });
    });

    // ── Zoom + pan ──────────────────────────────────────────────────────────
    const g = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.15, 5]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoom);

    // ── Force simulation ────────────────────────────────────────────────────
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(110).strength(0.6))
        .force('charge', d3.forceManyBody().strength(d => d.type === 'cluster' ? -1000 : -180))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 10))
        .alphaDecay(0.022);

    // ── Links ───────────────────────────────────────────────────────────────
    const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', d => getNodeColor(d.cluster))
        .attr('stroke-opacity', 0.28)
        .attr('stroke-width', 1.5);

    // ── Cluster node groups ─────────────────────────────────────────────────
    const clusterG = g.append('g')
        .selectAll('g')
        .data(nodes.filter(d => d.type === 'cluster'))
        .join('g')
        .style('cursor', 'pointer');

    // Outer glow halo
    clusterG.append('circle')
        .attr('r', d => d.radius + 10)
        .attr('fill', d => d.color)
        .attr('opacity', 0.12)
        .attr('filter', 'url(#glow-cluster)');

    // Main circle
    clusterG.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => d.color)
        .attr('opacity', 0.82)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#glow-cluster)');

    // Count inside node
    clusterG.append('text')
        .text(d => d.count)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', d => Math.max(10, Math.min(20, d.radius * 0.48)))
        .attr('font-weight', 'bold').attr('fill', '#fff')
        .attr('pointer-events', 'none');

    // Label below node
    clusterG.append('text')
        .text(d => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', d => d.radius + 17)
        .attr('font-size', 11.5)
        .attr('font-weight', '600')
        .attr('fill', '#cbd5e1')
        .attr('pointer-events', 'none')
        .style('text-shadow', '0 1px 4px #000');

    // ── Bookmark nodes ──────────────────────────────────────────────────────
    const bookmarkNode = g.append('g')
        .selectAll('circle')
        .data(nodes.filter(d => d.type === 'bookmark'))
        .join('circle')
        .attr('r', 5)
        .attr('fill', d => d.color)
        .attr('opacity', 0.7)
        .attr('stroke', d => d.color)
        .attr('stroke-width', 1)
        .attr('filter', 'url(#glow-bookmark)')
        .style('cursor', 'pointer');

    // ── Tooltip ─────────────────────────────────────────────────────────────
    const tooltip = d3.select('#graph-container').append('div')
        .style('position', 'absolute')
        .style('background', 'rgba(15,23,42,0.96)')
        .style('color', '#e2e8f0')
        .style('padding', '9px 13px')
        .style('border-radius', '8px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('max-width', '280px')
        .style('border', '1px solid #334155')
        .style('z-index', '200')
        .style('line-height', '1.6')
        .style('transition', 'opacity 0.15s');

    // ── Hover interactions ──────────────────────────────────────────────────
    clusterG
        .on('mouseenter', function(event, d) {
            const connectedIds = new Set(
                links.filter(l => l.source.id === d.id || l.target.id === d.id)
                     .flatMap(l => [l.source.id, l.target.id])
            );
            clusterG.attr('opacity', n => n.id === d.id ? 1 : 0.12);
            bookmarkNode.attr('opacity', n => connectedIds.has(n.id) ? 0.9 : 0.08);
            link.attr('stroke-opacity', l =>
                (l.source.id === d.id || l.target.id === d.id) ? 0.75 : 0.04
            ).attr('stroke-width', l =>
                (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1
            );
            const rect = container.getBoundingClientRect();
            tooltip
                .html(`<strong>${d.id}</strong><br><span style="color:#94a3b8">${d.count} bookmarks · click to filter</span>`)
                .style('opacity', 1)
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 10) + 'px');
        })
        .on('mousemove', function(event) {
            const rect = container.getBoundingClientRect();
            tooltip
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 10) + 'px');
        })
        .on('mouseleave', function() {
            clusterG.attr('opacity', 1);
            bookmarkNode.attr('opacity', 0.7);
            link.attr('stroke-opacity', 0.28).attr('stroke-width', 1.5);
            tooltip.style('opacity', 0);
        })
        .on('click', function(event, d) {
            event.stopPropagation();
            selectClusterFromGraph(d.id);
        })
        .call(d3.drag()
            .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
            .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        );

    bookmarkNode
        .on('mouseenter', function(event, d) {
            let hostname = d.url;
            try { hostname = new URL(d.url).hostname; } catch(_) {}
            const rect = container.getBoundingClientRect();
            tooltip
                .html(`<strong>${truncateText(d.title, 55)}</strong><br><span style="color:#94a3b8">${hostname}</span>`)
                .style('opacity', 1)
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 10) + 'px');
        })
        .on('mousemove', function(event) {
            const rect = container.getBoundingClientRect();
            tooltip
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 10) + 'px');
        })
        .on('mouseleave', () => tooltip.style('opacity', 0))
        .on('click', (e, d) => { e.stopPropagation(); window.open(d.url, '_blank'); })
        .call(d3.drag()
            .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
            .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        );

    // ── Tick ────────────────────────────────────────────────────────────────
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        clusterG.attr('transform', d => `translate(${d.x},${d.y})`);
        bookmarkNode.attr('cx', d => d.x).attr('cy', d => d.y);
    });

    // Auto-fit once simulation settles
    simulation.on('end', () => {
        const bounds = g.node().getBBox();
        if (bounds.width > 0) {
            const scale = Math.min(0.88, 0.88 / Math.max(bounds.width / width, bounds.height / height));
            const cx = bounds.x + bounds.width / 2;
            const cy = bounds.y + bounds.height / 2;
            svg.transition().duration(800).call(
                zoom.transform,
                d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-cx, -cy)
            );
        }
    });

    svg.on('click', () => tooltip.style('opacity', 0));

    // ── Control panel ────────────────────────────────────────────────────────
    const ctrlPanel = d3.select('#graph-container').append('div')
        .style('position', 'absolute')
        .style('top', '12px').style('right', '12px')
        .style('display', 'flex').style('flex-direction', 'column').style('gap', '5px')
        .style('z-index', '100');

    const btnBase = 'background:#1e293b;color:#e2e8f0;border:1px solid #334155;' +
        'border-radius:6px;padding:6px 10px;font-size:12px;cursor:pointer;' +
        'transition:background 0.15s;white-space:nowrap';

    const ctrlBtns = [
        ['⊕ Zoom In',  () => svg.transition().duration(300).call(zoom.scaleBy, 1.4)],
        ['⊖ Zoom Out', () => svg.transition().duration(300).call(zoom.scaleBy, 0.7)],
        ['⊞ Fit All',  () => {
            const b = g.node().getBBox();
            if (!b.width) return;
            const s = Math.min(0.88, 0.88 / Math.max(b.width / width, b.height / height));
            svg.transition().duration(700).call(
                zoom.transform,
                d3.zoomIdentity.translate(width/2, height/2).scale(s).translate(-(b.x+b.width/2), -(b.y+b.height/2))
            );
        }],
        ['↺ Reset',   () => svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity)],
    ];

    ctrlBtns.forEach(([label, fn]) => {
        ctrlPanel.append('button')
            .attr('style', btnBase)
            .text(label)
            .on('mouseenter', function() { this.style.background = '#334155'; })
            .on('mouseleave', function() { this.style.background = '#1e293b'; })
            .on('click', function(e) { e.stopPropagation(); fn(); });
    });

    // ── Legend hint ─────────────────────────────────────────────────────────
    d3.select('#graph-container').append('div')
        .style('position', 'absolute').style('bottom', '10px').style('left', '14px')
        .style('color', '#475569').style('font-size', '11px').style('pointer-events', 'none')
        .html('Drag nodes &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Click a category to filter');
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function copyToClipboard(url, button) {
    navigator.clipboard.writeText(url).then(() => {
        const orig = button.textContent;
        button.textContent = '✓';
        button.style.background = '#dcfce7';
        button.style.color = '#166534';
        setTimeout(() => {
            button.textContent = orig;
            button.style.background = '#f3f4f6';
            button.style.color = '#6b7280';
        }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const orig = button.textContent;
        button.textContent = '✓';
        button.style.background = '#dcfce7';
        button.style.color = '#166534';
        setTimeout(() => { button.textContent = orig; button.style.background = '#f3f4f6'; button.style.color = '#6b7280'; }, 2000);
    });
}

function showError(message) {
    const grid = document.getElementById('bookmarks-grid');
    grid.innerHTML = `<div class="loading" style="color:#ef4444">${message}</div>`;
}
