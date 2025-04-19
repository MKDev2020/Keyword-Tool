document.addEventListener('DOMContentLoaded', function () {
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

    const categories = [
        { name: 'Table', keywords: tableKeywords, colorClass: 'table-highlight' },
        { name: 'Section', keywords: sectionKeywords, colorClass: 'section-highlight' },
        { name: 'LSI', keywords: lsiKeywords, colorClass: 'lsi-highlight' }
    ];

    // Store results
    const results = [];
    const placeholders = [];
    let workingText = article;
    const keywordMap = {}; // To track usage and store original keyword

    categories.forEach(category => {
        const sortedKeywords = [...category.keywords].sort((a, b) => b.length - a.length);

        sortedKeywords.forEach((keyword, i) => {
            const escaped = escapeRegExp(keyword);
            const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');

            let matchCount = 0;
            let match;

            while ((match = pattern.exec(workingText)) !== null) {
                const placeholder = `{{kw${placeholders.length}}}`;
                const start = match.index;
                const end = start + match[0].length;

                placeholders.push({
                    placeholder,
                    keyword: match[0],
                    colorClass: category.colorClass,
                    start: start,
                    original: match[0]
                });

                workingText =
                    workingText.slice(0, start) +
                    placeholder +
                    workingText.slice(end);

                pattern.lastIndex = start + placeholder.length;
                matchCount++;
            }

            const lowerKey = keyword.toLowerCase();
            keywordMap[lowerKey] = {
                keyword,
                count: matchCount,
                category: category.name,
                class: category.colorClass.replace('-highlight', '-keyword')
            };
        });
    });

    // Add zero-count keywords
    categories.forEach(category => {
        category.keywords.forEach(keyword => {
            const lowerKey = keyword.toLowerCase();
            if (!keywordMap[lowerKey]) {
                keywordMap[lowerKey] = {
                    keyword,
                    count: 0,
                    category: category.name,
                    class: category.colorClass.replace('-highlight', '-keyword')
                };
            }
        });
    });

    const resultArray = Object.values(keywordMap);
    displayResults(resultArray, article, placeholders);
}

function parseKeywords(keywordString) {
    return keywordString
        .split(/[\n,]/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function displayResults(results, originalArticle, placeholders) {
    const articleElement = document.getElementById('highlightedArticle');
    const resultsTable = document.getElementById('resultsTable');

    // Sort placeholders by position for consistent replacement
    placeholders.sort((a, b) => a.start - b.start);

    let highlighted = originalArticle;
    for (let p of placeholders) {
        highlighted = highlighted.replace(
            p.placeholder,
            `<span class="highlight ${p.colorClass}">${p.keyword}</span>`
        );
    }

    articleElement.innerHTML = highlighted;

    if (results.length === 0) {
        resultsTable.innerHTML = '<p>No keywords found.</p>';
        return;
    }

    // Build results table
    const categoryOrder = ['Table', 'Section', 'LSI'];
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

    categoryOrder.forEach(cat => {
        const group = results.filter(r => r.category === cat);
        if (group.length > 0) {
            html += `<tr class="category-header"><td colspan="4"><strong>${cat} Keywords</strong></td></tr>`;
            group.forEach(r => {
                html += `
                    <tr>
                        <td><div class="color-swatch ${r.class.replace('-keyword', '-highlight')}"></div></td>
                        <td>${r.keyword}</td>
                        <td>${r.count}</td>
                        <td>${r.category}</td>
                    </tr>
                `;
            });
        }
    });

    html += `</tbody></table>`;
    resultsTable.innerHTML = html;
}
