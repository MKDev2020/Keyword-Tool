document.getElementById('countBtn').addEventListener('click', countKeywords);
document.getElementById('copyBtn').addEventListener('click', copyResults);

function countKeywords() {
    const article = document.getElementById('article').value;
    const tableKeywords = parseKeywords(document.getElementById('tableKeywords').value);
    const lsiKeywords = parseKeywords(document.getElementById('lsiKeywords').value);
    const sectionKeywords = parseKeywords(document.getElementById('sectionKeywords').value);
    
    if (!article) {
        alert('Please paste an article first.');
        return;
    }
    
    const results = [];
    const articleLower = article.toLowerCase();
    
    // Count keywords with overlap protection
    const allKeywords = [
        ...tableKeywords.map(kw => ({ kw, category: 'Table', class: 'table-highlight' })),
        ...lsiKeywords.map(kw => ({ kw, category: 'LSI', class: 'lsi-highlight' })),
        ...sectionKeywords.map(kw => ({ kw, category: 'Section', class: 'section-highlight' }))
    ];
    
    // Sort by longest first to prevent partial matches
    allKeywords.sort((a, b) => b.kw.length - a.kw.length);
    
    const occupiedPositions = [];
    
    allKeywords.forEach(({ kw, category, class: className }) => {
        const lowerKW = kw.toLowerCase();
        let count = 0;
        let pos = articleLower.indexOf(lowerKW);
        
        while (pos > -1) {
            const endPos = pos + kw.length;
            
            if (!isPositionOccupied(pos, endPos, occupiedPositions)) {
                count++;
                occupiedPositions.push([pos, endPos]);
            }
            
            pos = articleLower.indexOf(lowerKW, endPos);
        }
        
        if (count > 0) {
            results.push({
                keyword: kw,
                count,
                category,
                class: className.replace('-highlight', '-keyword')
            });
        }
    });
    
    displayResults(results, article);
    displaySummary(results);
}

function parseKeywords(keywordString) {
    return keywordString.split(/[\n,]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .map(keyword => keyword.toLowerCase());
}

function isPositionOccupied(start, end, occupiedPositions) {
    return occupiedPositions.some(([s, e]) => start < e && end > s);
}

function displayResults(results, originalArticle) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');
    
    // Highlight article
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
            
            if (occupied.some(([s, e]) => pos < e && endPos > s)) {
                return match;
            }
            
            occupied.push([pos, endPos]);
            return `<span class="highlight ${item.class.replace('-keyword', '-highlight')}">${match}</span>`;
        });
    });
    
    return highlighted;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function displaySummary(results) {
    const summaryContent = document.getElementById('summaryContent');
    
    if (!results.length) {
        summaryContent.innerHTML = '<p>No keywords to summarize.</p>';
        return;
    }
    
    const totals = results.reduce((acc, { category, count }) => {
        acc[category] = (acc[category] || 0) + count;
        return acc;
    }, {});
    
    const sorted = [...results].sort((a, b) => b.count - a.count);
    
    let html = `
        <p><strong>Total Keywords Found:</strong> ${Object.values(totals).reduce((a, b) => a + b, 0)}</p>
        <p><strong>By Category:</strong></p>
        <ul>
            ${Object.entries(totals).map(([cat, total]) => `<li>${cat}: ${total}</li>`).join('')}
        </ul>
        <p><strong>Top 5 Keywords:</strong></p>
        <ol>
            ${sorted.slice(0, 5).map(item => `<li>${item.keyword} (${item.count}×, ${item.category})</li>`).join('')}
        </ol>
    `;
    
    summaryContent.innerHTML = html;
}

function copyResults() {
    const articleText = document.getElementById('highlightedArticle').textContent;
    const tableText = document.getElementById('resultsTable').textContent;
    const textToCopy = `${articleText}\n\n${tableText}`;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => alert('Results copied!'))
        .catch(err => alert('Copy failed. Please try again.'));
}
