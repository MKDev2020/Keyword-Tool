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

    categories.forEach(category => {
        const sortedKeywords = [...category.keywords].sort((a, b) => b.length - a.length);

        sortedKeywords.forEach(keyword => {
            const lowerKW = keyword.toLowerCase();
            keywordCounts[lowerKW] = 0;

            const pattern = new RegExp(`(?<!\\w)${escapeRegExp(lowerKW)}(?!\\w)`, 'gi');
            let match;
            let updatedText = '';
            let lastIndex = 0;

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

                // Replace text up to match, insert placeholder
                updatedText += workingText.substring(lastIndex, match.index) + placeholder;
                lastIndex = match.index + match[0].length;

                keywordCounts[lowerKW]++;
            }

            // Append the remaining text
            updatedText += workingText.substring(lastIndex);
            workingText = updatedText;

            if (keywordCounts[lowerKW] > 0) {
                results.push({
                    keyword: keyword,
                    count: keywordCounts[lowerKW],
                    category: category.name,
                    class: category.colorClass.replace('-highlight', '-keyword')
                });
            }
        });
    });

    displayResults(results, workingText, placeholders);
}


function parseKeywords(keywordString) {
    return keywordString.split(/[\n,]/)
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
}

function displayResults(results, workingText, placeholders) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');

    // Replace placeholders with highlighted spans
    let highlightedText = workingText;
    placeholders.forEach(p => {
        const span = `<span class="highlight ${p.colorClass}">${p.original}</span>`;
        highlightedText = highlightedText.replace(p.placeholder, span);
    });

    articleElement.innerHTML = highlightedText.trim();

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
