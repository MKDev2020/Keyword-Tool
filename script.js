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
    
    // Process keywords by category in order
    const categories = [
        { name: 'Table', keywords: tableKeywords, class: 'table-highlight' },
        { name: 'Section', keywords: sectionKeywords, class: 'section-highlight' },
        { name: 'LSI', keywords: lsiKeywords, class: 'lsi-highlight' }
    ];
    
    const results = [];
    let workingText = ` ${article} `;
    const placeholders = [];
    const keywordCounts = {};

    // Process each category in order
    categories.forEach(category => {
        category.keywords.forEach(kw => {
            const pattern = new RegExp(`(?<!\\w)${escapeRegExp(kw)}(?!\\w)`, 'gi');
            let match;

            while ((match = pattern.exec(workingText)) !== null) {
                const placeholder = `{{kw${placeholders.length}}}`;
                placeholders.push({
                    placeholder,
                    keyword: match[0],
                    className: category.class,
                    original: match[0],
                    start: match.index,
                    category: category.name
                });

                workingText = workingText.substring(0, match.index) + 
                            placeholder + 
                            workingText.substring(match.index + match[0].length);
                pattern.lastIndex = match.index + placeholder.length;

                const key = `${category.name}_${kw.toLowerCase()}`;
                keywordCounts[key] = (keywordCounts[key] || 0) + 1;
            }
        });
    });

    // Build results in category order
    categories.forEach(category => {
        category.keywords.forEach(kw => {
            const key = `${category.name}_${kw.toLowerCase()}`;
            if (keywordCounts[key]) {
                results.push({
                    keyword: kw,
                    count: keywordCounts[key],
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
    
    // Group by category
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
            // Add keywords
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
    let workingText = ` ${text} `;
    const placeholders = [];
    
    // Sort by longest first
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
