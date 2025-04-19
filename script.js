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
    
    // Sort by longest first to prevent partial matches (from your working example)
    allKeywords.sort((a, b) => b.kw.length - a.kw.length);
    
    const results = [];
    let workingText = ` ${article} `; // Added spaces for better boundary matching
    const placeholders = [];
    const keywordCounts = {};

    // Implement the counting logic from your working example
    allKeywords.forEach(({ kw, category, class: className }) => {
        const pattern = new RegExp(`(?<!\\w)${escapeRegExp(kw)}(?!\\w)`, 'gi');
        let match;

        while ((match = pattern.exec(workingText)) !== null) {
            const placeholder = `{{kw${placeholders.length}}}`;
            placeholders.push({
                placeholder,
                keyword: match[0],
                className,
                original: match[0],
                start: match.index,
                category
            });

            workingText = workingText.substring(0, match.index) + 
                         placeholder + 
                         workingText.substring(match.index + match[0].length);
            pattern.lastIndex = match.index + placeholder.length;

            // Track counts per keyword
            const key = kw.toLowerCase();
            keywordCounts[key] = (keywordCounts[key] || 0) + 1;
        }
    });

    // Convert to our results format
    allKeywords.forEach(({ kw, category, class: className }) => {
        const key = kw.toLowerCase();
        if (keywordCounts[key]) {
            results.push({
                keyword: kw, // Preserve original casing
                count: keywordCounts[key],
                category,
                class: className.replace('-highlight', '-keyword')
            });
        }
    });

    displayResults(results, article);
}

// [Keep all other existing functions exactly the same]
function parseKeywords(keywordString) {
    return keywordString.split(/[\n,]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
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
    let workingText = ` ${text} `;
    const placeholders = [];
    
    // Sort by longest first (from your working example)
    results.sort((a, b) => b.keyword.length - a.keyword.length);
    
    results.forEach(item => {
        const pattern = new RegExp(`(?<!\\w)${escapeRegExp(item.keyword)}(?!\\w)`, 'gi');
        let match;

        while ((match = pattern.exec(workingText)) !== null) {
            const placeholder = `{{kw${placeholders.length}}}`;
            placeholders.push({
                placeholder,
                className: item.class.replace('-keyword', '-highlight'),
                original: match[0],
                start: match.index
            });

            workingText = workingText.substring(0, match.index) + 
                         placeholder + 
                         workingText.substring(match.index + match[0].length);
            pattern.lastIndex = match.index + placeholder.length;
        }
    });

    // Replace placeholders with spans
    placeholders.sort((a, b) => a.start - b.start);
    for (let p of placeholders) {
        workingText = workingText.replace(
            p.placeholder,
            `<span class="highlight ${p.className}">${p.original}</span>`
        );
    }

    return workingText.trim();
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
