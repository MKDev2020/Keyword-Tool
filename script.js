document.addEventListener('DOMContentLoaded', function () {
    // 🔁 Shared link logic from JSONBin
    const urlParams = new URLSearchParams(window.location.search);
    const binId = urlParams.get('bin');
    if (binId) {
        fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': '$2a$10$uN1KTFWnNUrDAkdKCMnLsuRiCydJCUybHsplO0rmmohBfpri/QHFu' // 🔁 Replace this with your real JSONBin key
            }
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById('article').value = data.record.article;
            document.getElementById('tableKeywords').value = data.record.tableKeywords;
            document.getElementById('lsiKeywords').value = data.record.lsiKeywords;
            document.getElementById('sectionKeywords').value = data.record.sectionKeywords;
            countKeywords(); // Auto-highlight
        })
        .catch(err => {
            console.error('Error loading shared data:', err);
        });
    }

    // 📌 Your existing event listener setup
    document.getElementById('countBtn').addEventListener('click', countKeywords);
});

function countKeywords() {
    const article = document.getElementById('article').value; 
   
   // More accurate word count to match Google Docs // Updated on 24/04/2025
const wordMatches = article.match(/[\w’'-]+/g); // Includes contractions, dashes, and curly apostrophes
const wordCount = wordMatches ? wordMatches.length : 0;

document.getElementById('wordCount').textContent = `${wordCount.toLocaleString()}`; // Updated on 24/04/2025
    
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
                density: wordCount > 0 ? ((keywordCounts[lower] / wordCount) * 100).toFixed(2) + "%" : "0%", // Updated calculation // added on 24/04/2025
                category,
                class: colorClass.replace('-highlight', '-keyword')
            });
        }
    });

    displayResults(results, workingText, placeholders);
}

function parseKeywords(keywordString) {
    return keywordString
        .split(/[\n,]/)
        .map(keyword => keyword.trim().toLowerCase())
        .filter(keyword => keyword.length > 0);
}

function displayResults(results, workingText, placeholders) {
    const resultsTable = document.getElementById('resultsTable');
    const articleElement = document.getElementById('highlightedArticle');

    // Start with the working text
    let highlightedText = workingText;

    // Replace all placeholders with span-wrapped keywords
    placeholders.forEach(p => {
        const span = `<span class="highlight ${p.colorClass}">${p.original}</span>`;
        highlightedText = highlightedText.replace(p.placeholder, span);
    });

    console.log(highlightedText);
    articleElement.innerHTML = highlightedText.trim();

    // Build results table // added "<th>Density (%)</th>" on 24/04/2025
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Color</th>
                    <th>Keyword</th>
                    <th>Count</th>
                    <th>Density (%)</th>
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
            // added "<td>${item.density}</td>" on 24/04/2025
            // New update changed the above to "<td>${((item.count / wordCount) * 100).toFixed(2)}%</td> <!-- Updated to use item.count -->" on 24/04/2025
            // New update changed the above to "<td>${item.density}</td> <!-- Display pre-calculated density -->" on 24/04/2025
            categoryResults.forEach(item => {
                html += `
                    <tr>
                        <td><div class="color-swatch ${item.class.replace('-keyword', '-highlight')}"></div></td>
                        <td>${item.keyword}</td>
                        <td>${item.count}</td>
                        <td>${item.density}</td> <!-- Display pre-calculated density --> 
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

window.addEventListener('DOMContentLoaded', () => {
    // Clear Button Handler
    document.getElementById('clearBtn').addEventListener('click', () => {
        const confirmed = confirm("Are you sure you want to clear all text and results?");
        if (confirmed) {
            document.getElementById('article').value = '';
            document.getElementById('tableKeywords').value = '';
            document.getElementById('lsiKeywords').value = '';
            document.getElementById('sectionKeywords').value = '';
            document.getElementById('highlightedArticle').innerHTML = '';
            document.getElementById('resultsTable').innerHTML = '';
        }
    });

    // Sample Highlight Preview (Only if nothing is already there)
    const articleContent = document.getElementById('highlightedArticle').innerHTML.trim();
    if (!articleContent) {
        const testText = `
            This is a <span class="highlight table-highlight">table keyword</span>, 
            a <span class="highlight lsi-highlight">LSI keyword</span>, and 
            a <span class="highlight section-highlight">section keyword</span>.
        `;
        document.getElementById('highlightedArticle').innerHTML = testText.trim();
    }
});

    // Share Results Button Handler
    document.getElementById('shareBtn').addEventListener('click', async () => {
        const article = document.getElementById('article').value.trim();
        const tableKeywords = document.getElementById('tableKeywords').value.trim();
        const lsiKeywords = document.getElementById('lsiKeywords').value.trim();
        const sectionKeywords = document.getElementById('sectionKeywords').value.trim();

        if (!article) {
            alert("Paste an article first before sharing.");
            return;
        }

        const data = {
            article,
            tableKeywords,
            lsiKeywords,
            sectionKeywords
        };

        try {
            const res = await fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': '$2a$10$uN1KTFWnNUrDAkdKCMnLsuRiCydJCUybHsplO0rmmohBfpri/QHFu',
                    'X-Bin-Private': 'false'  // Make bin public so others can view
                },
                body: JSON.stringify(data)
            });

            const json = await res.json();
            const binId = json.metadata.id;
            const shareLink = `${window.location.origin}${window.location.pathname}?bin=${binId}`;
            document.getElementById('shareLink').value = shareLink;
        } catch (err) {
            alert('Error creating shareable link. Please try again.');
            console.error(err);
        }
    });

// LOAD SHARED DATA ON PAGE LOAD
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');

    if (encodedData) {
        try {
            const json = JSON.parse(decodeURIComponent(atob(encodedData)));
            document.getElementById('article').value = json.article || '';
            document.getElementById('tableKeywords').value = json.table || '';
            document.getElementById('lsiKeywords').value = json.lsi || '';
            document.getElementById('sectionKeywords').value = json.section || '';

            countKeywords(); // Auto-run analysis
        } catch (e) {
            console.error("Failed to load shared data:", e);
        }
    }
});
