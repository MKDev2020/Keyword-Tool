document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('countBtn').addEventListener('click', countKeywords);
});

function countKeywords() {
    const article = document.getElementById('article').value;
    const tableKeywords = parseKeywords(document.getElementById('tableKeywords').value);
    const lsiKeywords = parseKeywords(document.getElementById('lsiKeywords').value);
    const sectionKeywords = parseKeywords(document.getElementById('sectionKeywords').value);
    
    if (!article) {
        alert('Please paste an article first.');
        return;
    }
    
    // Process keywords by category in order (Table -> Section -> LSI)
    const categories = [
        { name: 'Table', keywords: tableKeywords, class: 'table-highlight' },
        { name: 'Section', keywords: sectionKeywords, class: 'section-highlight' },
        { name: 'LSI', keywords: lsiKeywords, class: 'lsi-highlight' }
    ];
    
    const results = [];
    const articleLower = article.toLowerCase();
    const occupiedPositions = [];

    // Process each category in order
    categories.forEach(category => {
        // Sort keywords by length (longest first) to prevent partial matches
        const sortedKeywords = [...category.keywords].sort((a, b) => b.length - a.length);
        
        sortedKeywords.forEach(keyword => {
            const lowerKW = keyword.toLowerCase();
            let count = 0;
            let pos = articleLower.indexOf(lowerKW);
            
            while (pos > -1) {
                const endPos = pos + keyword.length;
                
                // Check if position is already occupied by a longer keyword
                if (!isPositionOccupied(pos, endPos, occupiedPositions)) {
                    count++;
                    occupiedPositions.push([pos, endPos]);
                }
                
                pos = articleLower.indexOf(lowerKW, endPos);
            }
            
            if (count > 0) {
                results.push({
                    keyword: keyword, // Preserve original keyword casing
                    count: count,
                    category: category.name,
                    class: category.class.replace('-highlight', '-keyword')
                });
            }
        });
    });

    displayResults(results, article);
}

function parseKeywords(keywordString) {
    return keywordString.split(/[\n,]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
}

function isPositionOccupied(start, end, occupiedPositions) {
    return occupiedPositions.some(([s, e]) => start < e && end > s);
}

function displayResults(results, originalArticle) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');
    
    // Display highlighted article
    articleElement.innerHTML = highlightKeywords(originalArticle, results);
    
    // Create results table
    if (results.length === 0) {
        resultsTable.innerHTML = '<p>No keywords found.</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Color</th>
                    <th>Keyword</th>
                    <th>Count</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Group by category (Table -> Section -> LSI)
    const categories = ['Table', 'Section', 'LSI'];
    categories.forEach(category => {
        const categoryResults = results.filter(r => r.category === category);
        if (categoryResults.length > 0) {
            // Add category header
            html += `
                <tr class="category-header">
                    <td colspan="4"><strong>${category} Keywords</strong></td>
                </tr>
            `;
            
            // Add keywords for this category
            categoryResults.forEach(item => {
                html += `
                    <tr>
                        <td><div class="color-swatch ${item.class.replace('-keyword', '-highlight')}"></div></td>
                        <td>${item.keyword}</td>
                        <td>${item.count}</td>
                        <td>${item.category}</td>
                    </tr>
                `;
            });
        }
    });
    
    html += `</tbody></table>`;
    resultsTable.innerHTML = html;
}

function highlightKeywords(text, results) {
    let highlighted = text;
    const occupied = [];
    
    // Process longer keywords first
    results.sort((a, b) => b.keyword.length - a.keyword.length);
    
    results.forEach(item => {
        const regex = new RegExp(`\\b${escapeRegExp(item.keyword)}\\b`, 'gi');
        highlighted = highlighted.replace(regex, match => {
            const lowerMatch = match.toLowerCase();
            const pos = highlighted.toLowerCase().indexOf(lowerMatch);
            const endPos = pos + match.length;
            
            if (!isPositionOccupied(pos, endPos, occupied)) {
                occupied.push([pos, endPos]);
                return `<span class="highlight ${item.class.replace('-keyword', '-highlight')}">${match}</span>`;
            }
            return match;
        });
    });
    
    return highlighted;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
