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

    categories.forEach(category => {
        const sortedKeywords = [...category.keywords].sort((a, b) => b.length - a.length);

        sortedKeywords.forEach(keyword => {
            const lowerKW = keyword.toLowerCase();
            keywordCounts[lowerKW] = 0;

            const pattern = new RegExp(`(?<!\\w)${escapeRegExp(lowerKW)}(?!\\w)`, 'gi');
            let match;
            while ((match = pattern.exec(workingText)) !== null) {
                const placeholder = `{{kw${placeholders.length}}}`;
                placeholders.push({
                    placeholder,
                    keyword: match[0],
                    colorClass: category.colorClass,
                    original: match[0],
                    start: match.index
                });

                workingText = workingText.substring(0, match.index) +
                    placeholder +
                    workingText.substring(match.index + match[0].length);
                pattern.lastIndex = match.index + placeholder.length;

                keywordCounts[lowerKW]++;
            }

            results.push({
                keyword: keyword,
                count: keywordCounts[lowerKW],
                category: category.name,
                class: category.colorClass
            });
        });
    });

    displayResults(results, article, placeholders);
}

function parseKeywords(keywordString) {
    return keywordString
        .split(/[\n,]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
}

function displayResults(results, originalArticle, placeholders) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');

    let highlightedText = ` ${originalArticle} `;
    placeholders.sort((a, b) => a.start - b.start);

    for (let p of placeholders) {
        highlightedText = highlightedText.replace(
            p.placeholder,
            `<span class="highlight ${p.colorClass}">${p.original}</span>`
        );
    }

    articleElement.innerHTML = highlightedText.trim();

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
            html += `<tr class="category-header"><td colspan="4"><strong>${category} Keywords</strong></td></tr>`;
            categoryResults.forEach(item => {
                html += `
                    <tr>
                        <td><div class="color-swatch ${item.class}"></div></td>
                        <td>${item.keyword}</td>
                        <td>${item.count}</td>
                        <td>${item.category}</td>
                    </tr>
                `;
            });
        }
    });

    html += '</tbody></table>';
    resultsTable.innerHTML = html;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
