// Simple fallback graph visualization without D3.js dependencies
function renderSimpleGraph() {
    const container = document.getElementById('graph-container');
    container.innerHTML = '';
    
    if (!bookmarksData || !bookmarksData.clusters) {
        container.innerHTML = '<div class="loading">Loading graph data...</div>';
        return;
    }
    
    // Create a comprehensive visualization showing ALL categories
    const sortedClusters = [...bookmarksData.clusters].sort((a, b) => b.count - a.count);
    
    const graphHTML = `
        <div style="padding: 20px; height: 580px; overflow: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0;">All ${bookmarksData.total_clusters} Bookmark Categories</h3>
                <p style="color: #6b7280; margin: 0 0 10px 0;">${bookmarksData.total_bookmarks} total bookmarks</p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">↕️↔️ Scroll horizontally and vertically to explore all categories</p>
            </div>
            
            <div style="
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
                gap: 16px;
                min-width: 100%;
                width: max-content;
            ">
                ${sortedClusters.map((cluster, index) => {
                    const percentage = (cluster.count / bookmarksData.total_bookmarks * 100).toFixed(1);
                    const barWidth = Math.max(8, Math.min(95, percentage * 2));
                    const hue = (index * 137.5) % 360; // Golden angle for nice color distribution
                    const bgColor = \`hsl(\${hue}, 60%, 95%)\`;
                    const borderColor = \`hsl(\${hue}, 60%, 70%)\`;
                    
                    return \`
                        <div style="
                            background: \${bgColor}; 
                            border: 2px solid \${borderColor};
                            border-radius: 12px; 
                            padding: 16px; 
                            cursor: pointer;
                            transition: all 0.2s ease;
                            position: relative;
                            overflow: hidden;
                        " onclick="selectClusterFromGraph('\${cluster.name}')" 
                           oncontextmenu="event.preventDefault(); showClusterInfo('\${cluster.name}'); return false;"
                           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)'"
                           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                           title="Left click: Filter category | Right click: View all bookmarks">
                            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1e293b; display: flex; align-items: center; gap: 8px; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 20px;">\${getClusterIcon(cluster.name)}</span>
                                    <span>\${cluster.name}</span>
                                </div>
                                <button onclick="event.stopPropagation(); showClusterInfo('\${cluster.name}')" 
                                        style="background: \${borderColor}; color: white; border: none; border-radius: 50%; 
                                               width: 24px; height: 24px; cursor: pointer; font-size: 12px; display: flex; 
                                               align-items: center; justify-content: center;" 
                                        title="View all bookmarks in this category">ℹ️</button>
                            </div>
                            <div style="
                                background: linear-gradient(90deg, \${borderColor} 0%, \${borderColor} \${barWidth}%, #e5e7eb \${barWidth}%);
                                height: 6px;
                                border-radius: 3px;
                                margin-bottom: 12px;
                            "></div>
                            <div style="font-size: 14px; color: #374151; margin-bottom: 8px;">
                                <strong>\${cluster.count}</strong> bookmarks (\${percentage}%)
                            </div>
                            <div style="font-size: 11px; color: #6b7280; line-height: 1.3;">
                                \${cluster.bookmarks.slice(0, 2).map(b => 
                                    \`<div style="margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">• \${b.title}</div>\`
                                ).join('')}
                                \${cluster.count > 2 ? \`<div style="font-style: italic;">... and \${cluster.count - 2} more</div>\` : ''}
                            </div>
                        </div>
                    \`;
                }).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = graphHTML;
}

// Function to select cluster from graph view
function selectClusterFromGraph(clusterName) {
    // Find the cluster item in sidebar and click it
    const clusterItems = document.querySelectorAll('.cluster-item');
    clusterItems.forEach(item => {
        if (item.textContent.includes(clusterName)) {
            item.click();
            // Switch back to grid view to see results
            document.getElementById('grid-view').click();
            // Scroll to top of grid view for better UX
            document.getElementById('grid-container').scrollTop = 0;
            // Highlight the sidebar selection
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// Function to show detailed cluster information
function showClusterInfo(clusterName) {
    const cluster = bookmarksData.clusters.find(c => c.name === clusterName);
    if (!cluster) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 1000; display: flex;
        align-items: center; justify-content: center; padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white; border-radius: 12px; padding: 30px; max-width: 600px;
        max-height: 80vh; overflow-y: auto; position: relative;
    `;
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #1e293b;">${getClusterIcon(clusterName)} ${clusterName}</h2>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                    style="background: #ef4444; color: white; border: none; border-radius: 50%; 
                           width: 30px; height: 30px; cursor: pointer; font-size: 16px;">×</button>
        </div>
        <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
            <p style="margin: 0; font-size: 16px; color: #374151;">
                <strong>${cluster.count}</strong> bookmarks 
                (${(cluster.count / bookmarksData.total_bookmarks * 100).toFixed(1)}% of total)
            </p>
        </div>
        <div style="margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-bottom: 15px;">All Bookmarks in ${clusterName}:</h3>
            <div style="max-height: 300px; overflow-y: auto;">
                ${cluster.bookmarks.map((bookmark, index) => `
                    <div style="padding: 10px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 10px;">
                        <span style="color: #6b7280; font-size: 12px; min-width: 20px;">${index + 1}.</span>
                        <div style="flex: 1;">
                            <a href="${bookmark.url}" target="_blank" 
                               style="color: #4f46e5; text-decoration: none; font-weight: 500; display: block; margin-bottom: 4px;"
                               onmouseover="this.style.textDecoration='underline'"
                               onmouseout="this.style.textDecoration='none'">
                                ${bookmark.title}
                            </a>
                            <div style="font-size: 12px; color: #6b7280;">${bookmark.domain}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="selectClusterFromGraph('${clusterName}'); this.parentElement.parentElement.parentElement.remove();"
                    style="background: #4f46e5; color: white; border: none; border-radius: 6px; 
                           padding: 10px 20px; cursor: pointer; font-weight: 500;">
                View in Grid
            </button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()"
                    style="background: #6b7280; color: white; border: none; border-radius: 6px; 
                           padding: 10px 20px; cursor: pointer; font-weight: 500;">
                Close
            </button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}