// script.js - COMPLETE FILE (copy this exactly)
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('countBtn').addEventListener('click', countKeywords);
    document.getElementById('copyBtn').addEventListener('click', copyResults);
});

function countKeywords() {
    const article = document.getElementById('article').value;
    if (!article.trim()) {
        alert('Please paste an article first.');
        return;
    }

    const results = [
        ...processKeywords('tableKeywords', 'Table', 'table-highlight'),
        ...processKeywords('lsiKeywords', 'LSI', 'lsi-highlight'),
        ...processKeywords('sectionKeywords', 'Section', 'section-highlight')
    ];

    displayResults(results, article);
}

function processKeywords(textareaId, category, highlightClass) {
    const keywords = parseKeywords(document.getElementById(textareaId).value);
    const article = document.getElementById('article').value.toLowerCase();
    const results = [];
    const occupiedPositions = [];

    keywords.forEach(keyword => {
        const count = countOccurrences(article, keyword, occupiedPositions);
        if (count > 0) {
            results.push({
                keyword: keyword,
                count: count,
                category: category,
                highlightClass: highlightClass,
                tableClass: highlightClass.replace('-highlight', '-keyword')
            });
        }
    });

    return results;
}

function parseKeywords(input) {
    return input.split(/[\n,]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
}

function countOccurrences(text, keyword, occupied) {
    let count = 0;
    let pos = text.indexOf(keyword);
    
    while (pos > -1) {
        const endPos = pos + keyword.length;
        if (!isOccupied(pos, endPos, occupied)) {
            count++;
            occupied.push([pos, endPos]);
        }
        pos = text.indexOf(keyword, endPos);
    }
    return count;
}

function isOccupied(start, end, occupied) {
    return occupied.some(([s, e]) => start < e && end > s);
}

function displayResults(results, originalArticle) {
    const articleElement = document.getElementById('highlightedArticle');
    const resultsTable = document.getElementById('resultsTable');

    articleElement.innerHTML = highlightArticle(originalArticle, results);
    resultsTable.innerHTML = generateResultsTable(results);
}

function highlightArticle(text, results) {
    let highlighted = text;
    const occupied = [];
    
    // Sort by longest first to prevent partial highlighting
    results.sort((a, b) => b.keyword.length - a.keyword.length);
    
    results.forEach(item => {
        const regex = new RegExp(`\\b${escapeRegExp(item.keyword)}\\b`, 'gi');
        highlighted = highlighted.replace(regex, match => {
            const lowerMatch = match.toLowerCase();
            const pos = highlighted.toLowerCase().indexOf(lowerMatch);
            const endPos = pos + match.length;
            
            if (!isOccupied(pos, endPos, occupied)) {
                occupied.push([pos, endPos]);
                return `<span class="highlight ${item.highlightClass}">${match}</span>`;
            }
            return match;
        });
    });
    
    return highlighted;
}

function generateResultsTable(results) {
    if (results.length === 0) return '<p>No keywords found.</p>';

    return `
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
                ${results.map(item => `
                    <tr>
                        <td><div class="color-swatch ${item.highlightClass}"></div></td>
                        <td>${item.keyword}</td>
                        <td>${item.count}</td>
                        <td>${item.category}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function copyResults() {
    const articleText = document.getElementById('highlightedArticle').textContent;
    const tableText = document.getElementById('resultsTable').textContent;
    
    navigator.clipboard.writeText(`${articleText}\n\n${tableText}`)
        .then(() => alert('Results copied to clipboard!'))
        .catch(() => alert('Failed to copy. Please try again.'));
}
