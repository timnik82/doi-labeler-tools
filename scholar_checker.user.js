// ==UserScript==
// @name         Scholar Title Checker (Robust CSV + Subscript Handling)
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Marks Google Scholar results with ✓/❌/🟡 by comparing normalized titles to a Google Sheet. Handles quoted commas, Unicode subscripts, diacritics & punctuation.
// @match        https://scholar.google.com/*
// @grant        none
// @connect      docs.google.com
// ==/UserScript==

(function () {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTT7iVdf6eQ5YHDWpaU2mwan4IpBYGe4oHPfZSrJDWq-UYQv3VCLMJuZB5Mk8bRLG88Sr-MMHX0WKRH/pub?output=csv';
    const TITLE_COL = 5;   // zero‑based index of the Title column (column F)
    const LABEL_COL = 1;   // zero‑based index of the Label column (column B)

    // --- Helpers -------------------------------------------------------------

    /** Converts a single Unicode subscript digit to its normal form */
    function subToDigit(ch) {
        const map = {
            '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
            '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
        };
        return map[ch] || ch;
    }

    /**
     * Normalise the title so tiny differences do not block a match.
     * Steps:
     *   1) Replace Unicode subscript digits with plain digits.
     *   2) Unicode‑decompose accents, then strip diacritics.
     *   3) Replace every non‑alphanumeric char with a space.
     *   4) Collapse whitespace to single spaces, trim ends.
     *   5) Lower‑case.
     */
    function normalizeTitle(str) {
        str = str.replace(/[₀-₉]/g, subToDigit)        // subscripts → digits
                 .normalize('NFD')                     // decompose accents
                 .replace(/[\u0300-\u036f]/g, '')     // strip diacritics
                 .replace(/[^A-Za-z0-9]+/g, ' ')        // punctuation → space
                 .replace(/\s+/g, ' ')                 // collapse spaces
                 .trim()
                 .toLowerCase();
        return str;
    }

    /** Split a CSV line honouring quoted cells. */
    function splitCSVLine(line) {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                // double quote inside quoted cell – either escape or toggle
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++; // skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                out.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        out.push(cur);
        return out;
    }

    /** Append a marker span (✓ / ❌ / 🟡) after the title element */
    function addMarker(el, type) {
        const s = document.createElement('span');
        s.style.marginLeft = '6px';
        s.style.fontSize = '14px';
        s.style.fontWeight = 'bold';
        if (type === 'yes') {
            s.textContent = '✅';
            s.title = 'Labeled Yes';
        } else if (type === 'no') {
            s.textContent = '❌';
            s.title = 'Labeled No';
        } else {
            s.textContent = '🟡';
            s.title = 'Not found in database';
        }
        el.appendChild(s);
    }

    // --- Main ---------------------------------------------------------------

    fetch(csvUrl)
        .then(resp => resp.text())
        .then(text => {
            const lines = text.trim().split(/\r?\n/).slice(1); // skip header row
            const titleMap = new Map();

            for (const line of lines) {
                const cols = splitCSVLine(line);
                const rawTitle = (cols[TITLE_COL] || '').replace(/^"|"$/g, '').trim();
                const label    = (cols[LABEL_COL] || '').trim().toLowerCase();
                if (!rawTitle) continue;
                titleMap.set(normalizeTitle(rawTitle), label);
            }

            document.querySelectorAll('h3.gs_rt').forEach(h3 => {
                const raw = (h3.querySelector('a')?.textContent || h3.textContent).trim();
                const key = normalizeTitle(raw);
                const label = titleMap.get(key);
                if (label === 'yes') addMarker(h3, 'yes');
                else if (label === 'no') addMarker(h3, 'no');
                else addMarker(h3, 'missing');
            });
        })
        .catch(err => console.error('[Scholar Checker] CSV load error:', err));
})();
