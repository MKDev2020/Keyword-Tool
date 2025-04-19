document.getElementById('countBtn').addEventListener('click', countKeywords);
document.getElementById('copyBtn').addEventListener('click', copyResults);

function countKeywords() {
    const article = document.getElementById('article').value.toLowerCase();
    const tableKeywords = parseKeywords(document.getElementById('tableKeywords').value);
    const lsiKeywords = parseKeywords(document.getElementById('lsiKeywords').value);
    const sectionKeywords = parseKeywords(document.getElementById('sectionKeywords').value);
    
    if (!article) {
        alert('Please paste an article first.');
        return;
    }
    
    const results = [];
    
    // Count table keywords
    tableKeywords.forEach(keyword => {
        const count = countExactMatches(article, keyword);
        results.push({
            keyword,
            count,
            category: 'Table',
            class: 'table-keyword'
        });
    });
    
    // Count LSI keywords
    lsiKeywords.forEach(keyword => {
        const count = countExactMatches(article, keyword);
        results.push({
            keyword,
            count,
            category: 'LSI',
            class: 'lsi-keyword'
        });
    });
    
    // Count section keywords
    sectionKeywords.forEach(keyword => {
        const count = countExactMatches(article, keyword);
        results.push({
            keyword,
            count,
            category: 'Section',
            class: 'section-keyword'
        });
    });
    
    displayResults(results);
    displaySummary(results);
}

function parseKeywords(keywordString) {
    return keywordString.split(',')
        .map(keyword => keyword.trim().toLowerCase())
        .filter(keyword => keyword.length > 0);
}

function countExactMatches(text, keyword) {
    if (!keyword) return 0;
    
    // Use regex to find exact word matches (case insensitive)
    const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
    const matches = text.match(regex);
    
    return matches ? matches.length : 0;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function displayResults(results) {
    const resultsTable = document.getElementById('resultsTable');
    
    if (results.length === 0) {
        resultsTable.innerHTML = '<p>No keywords found.</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Keyword</th>
                    <th>Count</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    results.forEach(item => {
        html += `
            <tr class="${item.class}">
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

function displaySummary(results) {
    const summaryContent = document.getElementById('summaryContent');
    
    if (results.length === 0) {
        summaryContent.innerHTML = '<p>No keywords to summarize.</p>';
        return;
    }
    
    // Calculate totals by category
    const tableTotal = results.filter(r => r.category === 'Table').reduce((sum, r) => sum + r.count, 0);
    const lsiTotal = results.filter(r => r.category === 'LSI').reduce((sum, r) => sum + r.count, 0);
    const sectionTotal = results.filter(r => r.category === 'Section').reduce((sum, r) => sum + r.count, 0);
    const grandTotal = tableTotal + lsiTotal + sectionTotal;
    
    // Find top keywords
    const sortedResults = [...results].sort((a, b) => b.count - a.count);
    const topKeywords = sortedResults.slice(0, 5);
    
    let html = `
        <p><strong>Total Keywords Found:</strong> ${grandTotal}</p>
        <p><strong>By Category:</strong></p>
        <ul>
            <li>Table: ${tableTotal}</li>
            <li>LSI: ${lsiTotal}</li>
            <li>Section: ${sectionTotal}</li>
        </ul>
        <p><strong>Top Keywords:</strong></p>
        <ol>
    `;
    
    topKeywords.forEach(item => {
        html += `<li>${item.keyword} (${item.count} times, ${item.category})</li>`;
    });
    
    html += `</ol>`;
    
    summaryContent.innerHTML = html;
}

function copyResults() {
    const resultsTable = document.getElementById('resultsTable');
    const summaryContent = document.getElementById('summaryContent');
    
    if (!resultsTable.innerHTML && !summaryContent.innerHTML) {
        alert('No results to copy. Please run the keyword count first.');
        return;
    }
    
    const textToCopy = resultsTable.innerText + '\n\n' + summaryContent.innerText;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            alert('Results copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy results. Please try again.');
        });
}
// script.js
// Updated parseKeywords function
function parseKeywords(keywordString) {
    return keywordString.split(/[,\n]/)
        .map(keyword => keyword.trim().toLowerCase())
        .filter(keyword => keyword.length > 0);
}

// New function to highlight text
function highlightKeywords(originalText, results) {
    let highlightedText = originalText;
    
    // Create a map of keywords with their highlight classes
    const highlightMap = {};
    results.forEach(item => {
        highlightMap[item.keyword] = item.class.replace('-keyword', '-highlight');
    });
    
    // Sort keywords by length (longest first) to prevent partial highlighting
    const sortedKeywords = Object.keys(highlightMap).sort((a, b) => b.length - a.length);
    
    sortedKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, match => {
            return `<span class="highlight ${highlightMap[keyword.toLowerCase()]}">${match}</span>`;
        });
    });
    
    return highlightedText;
}

// Updated displayResults function
function displayResults(results) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');
    const originalArticle = document.getElementById('article').value;
    
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
            <tr class="${item.class}">
                <td>
                    <div class="color-swatch ${item.class.replace('-keyword', '-highlight')}"></div>
                </td>
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

// Keep the rest of the existing JavaScript code the same
