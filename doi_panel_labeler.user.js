// ==UserScript==
// @name         DOI Labeler Panel
// @namespace    https://github.com/timnik82/doi-labeler-tools
// @version      1.1
// @description  Floating panel to label papers by DOI, category, and title, and log to Google Sheets
// @author       Timur
// @match        *://*/*
// @grant        none
// @connect      script.google.com
// @connect      docs.google.com
// ==/UserScript==

(function () {
    const user = 'Timur';
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxX_sOFoMlYpCK5OHnWA-jfOOg-JzTW4ntWW6vdHp0X6DERf7J42br5U1ztbV1P470/exec';
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTT7iVdf6eQ5YHDWpaU2mwan4IpBYGe4oHPfZSrJDWq-UYQv3VCLMJuZB5Mk8bRLG88Sr-MMHX0WKRH/pub?output=csv';

    const categoryMap = {
        "Conf. iso.": "Conformational isomerisation",
        "Taut./Struc. iso.": "Tautomerization/Structural Isomerization",
        "Nitrene/Carbene": "Nitrenes and Carbenes",
        "Radical": "Radical",
        "Ketenes": "Ketenes",
        "Complex/Weak": "Complexes and weakly bound species"
    };

    function extractDOI() {
        const links = Array.from(document.querySelectorAll('a[href*="doi.org/"]'));
        for (const link of links) {
            const match = link.href.match(/https?:\/\/doi\.org\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
            if (match) return match[0];
        }
        return null;
    }

    function extractTitle() {
        const meta = document.querySelector('meta[name="citation_title"]');
        if (meta?.content) return meta.content.trim();
        const og = document.querySelector('meta[property="og:title"]');
        if (og?.content) return og.content.trim();
        return document.title.trim();
    }

    const foundDoi = extractDOI();
    const foundTitle = extractTitle();

    const panel = document.createElement('div');
    panel.id = 'labelPanel';
    panel.style.position = 'fixed';
    panel.style.right = '10px';
    panel.style.top = '10px';
    panel.style.background = '#fff3cd';
    panel.style.border = '1px solid #f0c36d';
    panel.style.borderRadius = '8px';
    panel.style.padding = '6px';
    panel.style.zIndex = 9999;
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.1)';
    panel.innerHTML = `
        <div style="font-weight:bold; text-align:center; margin-bottom:4px;">Label this page</div>
        <div id="matchIndicator" style="text-align:center; margin:4px 0; font-size:12px;">⏳ Checking...</div>
        <div style="font-size: 11px; text-align:center; margin-bottom: 6px;">DOI: ${foundDoi ? foundDoi : '[not found]'}</div>
        <div style="display: flex; gap: 6px; align-items: center; justify-content: center;">
            <button id="noBtn" style="min-width: 40px; height: 20px; font-size: 11px;">No</button>
            <select id="categorySelect" style="height: 22px; font-size: 11px;">
                ${Object.keys(categoryMap).map(k => `<option value="${k}">${k}</option>`).join('')}
            </select>
            <button id="catBtn" title="Submit as Yes" style="height: 22px; width: 24px; font-size: 14px;">✔</button>
        </div>
    `;
    document.body.appendChild(panel);

    function disableButtons() {
        ['noBtn', 'catBtn', 'categorySelect'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
    }

    function sendData(label, category = "") {
        if (!foundDoi) return;

        disableButtons();
        document.getElementById('matchIndicator').textContent = '✅ Submitted!';
        document.getElementById('matchIndicator').style.color = 'green';

        fetch(webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                url: foundDoi,
                label: label,
                user: user,
                category: category,
                title: foundTitle
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // "No" always sends label = "No"
    document.getElementById('noBtn').onclick = () => sendData("No");

    // "Yes" now sends the selected short key rather than the full phrase
    document.getElementById('catBtn').onclick = () => {
        const selectedKey = document.getElementById('categorySelect').value;
        sendData("Yes", selectedKey);
    };

    fetch(csvUrl)
        .then(resp => resp.text())
        .then(csv => {
            const lines = csv.split('\n');
            const entries = lines.map(row => {
                const cells = row.split(',');
                return cells[0].replace(/['"]/g, '').trim().toLowerCase();
            });

            const match = foundDoi && entries.includes(foundDoi.trim().toLowerCase());
            const status = document.getElementById('matchIndicator');
            if (match) {
                status.textContent = '✅ DOI already labeled';
                status.style.color = 'green';
                disableButtons();
            } else if (foundDoi) {
                status.textContent = '❌ DOI not labeled yet';
                status.style.color = 'gray';
            } else {
                status.textContent = '⚠️ DOI not found on page';
                status.style.color = 'red';
            }
        });
})();
