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

    let workingText = ` ${article} `;
    const placeholders = [];
    const keywordCounts = {};
    const results = [];

    let allKeywords = [];
    categories.forEach((cat, catIndex) => {
        const sorted = [...cat.keywords].sort((a, b) => b.length - a.length);
        sorted.forEach(k => {
            const clean = k.trim();
            const lower = clean.toLowerCase();
            allKeywords.push({
                keyword: clean,
                lower,
                colorClass: cat.colorClass,
                category: cat.name,
                priority: catIndex
            });
            keywordCounts[lower] = 0;
        });
    });

    allKeywords.sort((a, b) => {
        if (b.lower.length !== a.lower.length) return b.lower.length - a.lower.length;
        return a.priority - b.priority;
    });

    allKeywords.forEach(({ keyword, lower, colorClass, category }) => {
        const pattern = new RegExp(`\\b${escapeRegExp(lower)}\\b`, 'gi');

        let match;
        while ((match = pattern.exec(workingText)) !== null) {
            const placeholder = `{{kw${placeholders.length}}}`;
            placeholders.push({
                placeholder,
                keyword: match[0],
                colorClass,
                original: match[0],
                start: match.index,
                category
            });

            workingText = workingText.substring(0, match.index) +
                          placeholder +
                          workingText.substring(match.index + match[0].length);

            pattern.lastIndex = match.index + placeholder.length;
            keywordCounts[lower]++;
        }
    });

    const unique = new Set();
    allKeywords.forEach(({ keyword, lower, colorClass, category }) => {
        if (!unique.has(lower)) {
            unique.add(lower);
            results.push({
                keyword,
                count: keywordCounts[lower],
                category,
                class: colorClass.replace('-highlight', '-keyword')
            });
        }
    });

    displayResults(results, article, placeholders);
}

function parseKeywords(keywordString) {
    return keywordString
        .split(/[\n,]/)
        .map(keyword => keyword.trim().toLowerCase())
        .filter(keyword => keyword.length > 0);
}

function displayResults(results, originalArticle, placeholders) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');

    // Start with the original article
    let highlightedText = ` ${originalArticle} `;

    // Replace all placeholders with span-wrapped keywords
    placeholders.forEach(p => {
        const span = `<span class="highlight ${p.colorClass}">${p.original}</span>`;
        highlightedText = highlightedText.replace(p.placeholder, span);
    });

    articleElement.innerHTML = highlightedText.trim();

    // Build results table
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

    const categoryOrder = ['Table', 'Section', 'LSI'];
    categoryOrder.forEach(category => {
        const categoryResults = results.filter(r => r.category === category);
        if (categoryResults.length > 0) {
            html += `
                <tr class="category-header">
                    <td colspan="4"><strong>${category} Keywords</strong></td>
                </tr>
            `;
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

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
