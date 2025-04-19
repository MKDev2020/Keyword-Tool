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

    const categories = [
        { name: 'Table', keywords: tableKeywords, colorClass: 'table-highlight' },
        { name: 'Section', keywords: sectionKeywords, colorClass: 'section-highlight' },
        { name: 'LSI', keywords: lsiKeywords, colorClass: 'lsi-highlight' }
    ];

    let workingText = ` ${article} `;
    const placeholders = [];
    const keywordCounts = {};
    const results = [];

    // Initialize all keyword counts to 0
    categories.forEach(category => {
        category.keywords.forEach(keyword => {
            const lowerKW = keyword.toLowerCase();
            keywordCounts[lowerKW] = 0;  // Set initial count to 0
        });
    });

    categories.forEach(category => {
        const sortedKeywords = [...category.keywords].sort((a, b) => b.length - a.length);

        sortedKeywords.forEach(keyword => {
            const lowerKW = keyword.toLowerCase();
            const pattern = new RegExp(`(?<!\\w)${escapeRegExp(lowerKW)}(?!\\w)`, 'gi');
            let match;

            while ((match = pattern.exec(workingText)) !== null) {
                const placeholder = `{{kw${placeholders.length}}}`;
                placeholders.push({
                    placeholder,
                    keyword: match[0],
                    colorClass: category.colorClass,
                    original: match[0],
                    start: match.index,
                    category: category.name
                });

                workingText = workingText.substring(0, match.index) +
                              placeholder +
                              workingText.substring(match.index + match[0].length);

                pattern.lastIndex = match.index + placeholder.length;
                keywordCounts[lowerKW]++;
            }
        });
    });

    // Create the highlighted article with the placeholders
    displayResults(results, article, placeholders, keywordCounts);
}

function parseKeywords(keywordString) {
    return keywordString.split(/[\n,]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
}

function displayResults(results, originalArticle, placeholders, keywordCounts) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');

    // Highlight article using exact matches (handling placeholders)
    let highlightedText = ` ${originalArticle} `;
    placeholders.sort((a, b) => a.start - b.start);
    for (let p of placeholders) {
        highlightedText = highlightedText.replace(
            p.placeholder,
            `<span class="highlight ${p.colorClass}">${p.original}</span>`
        );
    }
    articleElement.innerHTML = highlightedText.trim();

    // Build the results table
    if (Object.keys(keywordCounts).length === 0) {
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

    // Group by category (Table -> Section -> LSI)
    const categoryOrder = ['Table', 'Section', 'LSI'];
    categoryOrder.forEach(category => {
        const categoryResults = [];

        if (category === 'Table') {
            categoryResults.push(...tableKeywords);
        } else if (category === 'Section') {
            categoryResults.push(...sectionKeywords);
        } else if (category === 'LSI') {
            categoryResults.push(...lsiKeywords);
        }

        if (categoryResults.length > 0) {
            html += `
                <tr class="category-header">
                    <td colspan="4"><strong>${category} Keywords</strong></td>
                </tr>
            `;

            categoryResults.forEach(keyword => {
                const keywordLower = keyword.toLowerCase();
                const count = keywordCounts[keywordLower] || 0;

                html += `
                    <tr>
                        <td><div class="color-swatch ${category.toLowerCase()}-highlight"></div></td>
                        <td>${keyword}</td>
                        <td>${count}</td>
                        <td>${category}</td>
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
