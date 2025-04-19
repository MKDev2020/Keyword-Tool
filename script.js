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
    
    // Process keywords in our preferred order
    const allKeywords = [
        ...tableKeywords.map(kw => ({ kw, category: 'Table', class: 'table-highlight' })),
        ...sectionKeywords.map(kw => ({ kw, category: 'Section', class: 'section-highlight' })),
        ...lsiKeywords.map(kw => ({ kw, category: 'LSI', class: 'lsi-highlight' }))
    ];
    
    // Sort by longest first to prevent partial matches
    allKeywords.sort((a, b) => b.kw.length - a.kw.length);
    
    const results = [];
    let workingText = ` ${article} `;
    const placeholders = [];
    const keywordCounts = {};

    // Counting logic
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

            const key = `${category}_${kw.toLowerCase()}`;
            keywordCounts[key] = (keywordCounts[key] || 0) + 1;
        }
    });

    // Prepare results in our preferred order
    const categoryOrder = ['Table', 'Section', 'LSI'];
    categoryOrder.forEach(category => {
        allKeywords.filter(item => item.category === category).forEach(({ kw, category, class: className }) => {
            const key = `${category}_${kw.toLowerCase()}`;
            if (keywordCounts[key]) {
                results.push({
                    keyword: kw,
                    count: keywordCounts[key],
                    category,
                    class: className.replace('-highlight', '-keyword')
                });
            }
        });
    });

    displayResults(results, article);
}

// [Rest of the functions remain EXACTLY THE SAME as before]
function parseKeywords(keywordString) {
    return keywordString.split(/[\n,]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
}

function displayResults(results, originalArticle) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');
    
    articleElement.innerHTML = highlightKeywords(originalArticle, results);
    
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
    let workingText = ` ${text} `;
    const placeholders = [];
    
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
