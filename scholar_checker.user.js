
// ==UserScript==
// @name         Scholar Title Checker (Normalized)
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Marks Google Scholar titles with ✓/❌/❓ based on spreadsheet (normalized)
// @match        https://scholar.google.com/*
// @grant        none
// @connect      docs.google.com
// ==/UserScript==

(function () {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTT7iVdf6eQ5YHDWpaU2mwan4IpBYGe4oHPfZSrJDWq-UYQv3VCLMJuZB5Mk8bRLG88Sr-MMHX0WKRH/pub?output=csv';

    function normalize(text) {
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ')         // collapse spaces
            .replace(/[“”‘’]/g, '"')       // smart quotes → plain
            .replace(/[\[\]{}()]/g, '')  // remove brackets
            .replace(/[,.:;!?]/g, '')      // remove punctuation
            .replace(/[-]/g, '')           // remove dashes
            .trim();
    }

    function addMarker(el, type) {
        const span = document.createElement('span');
        span.style.marginLeft = '6px';
        span.style.fontSize = '14px';
        span.style.fontWeight = 'bold';

        if (type === 'yes') {
            span.textContent = '✅';
            span.title = 'Labeled Yes';
        } else if (type === 'no') {
            span.textContent = '❌';
            span.title = 'Labeled No';
        } else {
            span.textContent = '🟡';
            span.title = 'Not found in database';
        }

        el.appendChild(span);
    }

    fetch(csvUrl)
        .then(resp => resp.text())
        .then(csv => {
            const lines = csv.split('\n');
            const titleIndex = 5;  // column F = title
            const labelIndex = 1;  // column B = label
            const titleMap = new Map();

            for (const line of lines) {
                const cols = line.split(',');
                if (cols.length >= 6) {
                    const rawTitle = cols[titleIndex]?.trim() || '';
                    const normalizedTitle = normalize(rawTitle);
                    const label = cols[labelIndex]?.trim().toLowerCase() || '';
                    titleMap.set(normalizedTitle, label);
                }
            }

            const items = document.querySelectorAll('h3.gs_rt');
            for (const h3 of items) {
                const link = h3.querySelector('a');
                const text = link?.textContent || h3.textContent;
                const normalized = normalize(text);

                const label = titleMap.get(normalized);
                if (label === 'yes') {
                    addMarker(h3, 'yes');
                } else if (label === 'no') {
                    addMarker(h3, 'no');
                } else {
                    addMarker(h3, 'missing');
                }
            }
        });
})();
