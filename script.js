document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('countBtn').addEventListener('click', countKeywords);
    document.getElementById('copyBtn').addEventListener('click', copyResults);
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
    
    // Process all keywords together for accurate counting
    const allKeywords = [
        ...tableKeywords.map(kw => ({ kw, category: 'Table', class: 'table-highlight' })),
        ...lsiKeywords.map(kw => ({ kw, category: 'LSI', class: 'lsi-highlight' })),
        ...sectionKeywords.map(kw => ({ kw, category: 'Section', class: 'section-highlight' }))
    ];
    
    // Sort by longest first to prevent partial matches
    allKeywords.sort((a, b) => b.kw.length - a.kw.length);
    
    const results = [];
    const articleLower = article.toLowerCase();
    const occupiedPositions = [];
    
    allKeywords.forEach(({ kw, category, class: className }) => {
        const lowerKW = kw.toLowerCase();
        let count = 0;
        let pos = articleLower.indexOf(lowerKW);
        
        while (pos > -1) {
            const endPos = pos + kw.length;
            
            // Check if position is already occupied by a longer keyword
            if (!isPositionOccupied(pos, endPos, occupiedPositions)) {
                count++;
                occupiedPositions.push([pos, endPos]);
            }
            
            pos = articleLower.indexOf(lowerKW, endPos);
        }
        
        if (count > 0) {
            results.push({
                keyword: kw, // Preserve original keyword casing
                count,
                category,
                class: className.replace('-highlight', '-keyword')
            });
        }
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
    
    results.forEach(item => {
        html += `
            <tr>
                <td><div class="color-swatch ${item.class.replace('-keyword', '-highlight')}"></div></td>
                <td>${item.keyword}</td>
                <td>${item.count}</td>
                <td>${item.category}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
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

function copyResults() {
    const articleText = document.getElementById('highlightedArticle').textContent;
    const tableText = document.getElementById('resultsTable').textContent;
    const textToCopy = `${articleText}\n\n${tableText}`;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => alert('Results copied to clipboard!'))
        .catch(err => alert('Failed to copy results. Please try again.'));
}
