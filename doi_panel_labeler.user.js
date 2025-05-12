
// ==UserScript==
// @name         DOI Labeler Panel (DOI Column Fix)
// @namespace    http://tampermonkey.net/
// @version      1.13
// @description  Robustly checks DOI against first column in Google Sheet regardless of other columns
// @match        *://*/*
// @grant        none
// @connect      script.google.com
// @connect      docs.google.com
// ==/UserScript==

(function () {
    const user = 'Timur';
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxX_sOFoMlYpCK5OHnWA-jfOOg-JzTW4ntWW6vdHp0X6DERf7J42br5U1ztbV1P470/exec';
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTT7iVdf6eQ5YHDWpaU2mwan4IpBYGe4oHPfZSrJDWq-UYQv3VCLMJuZB5Mk8bRLG88Sr-MMHX0WKRH/pub?output=csv';

    function extractDOI() {
        const links = Array.from(document.querySelectorAll('a[href*="doi.org/"]'));
        for (const link of links) {
            const href = link.href;
            const match = href.match(/https?:\/\/doi\.org\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
            if (match) return match[0];
        }
        return null;
    }

    const foundDoi = extractDOI();

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
    panel.style.cursor = 'move';
    panel.innerHTML = `
        <div id="dragHandle" style="cursor:move; background:#eee; padding:3px; text-align:center; font-weight:bold;">
            Label this page
        </div>
        <div id="matchIndicator" style="text-align:center; margin:5px 0; font-weight:bold;">⏳ Checking...</div>
        <div id="doiDisplay" style="font-size: 11px; color: #555; text-align: center; margin-bottom: 4px;">
            DOI: ${foundDoi ? foundDoi : '[not found]'}
        </div>
    `;
    document.body.appendChild(panel);

    fetch(csvUrl)
        .then(resp => resp.text())
        .then(csv => {
            const lines = csv.split('\n');
            const sheetDois = lines.map(row => {
                const cells = row.split(',');
                return cells[0].replace(/['"]/g, '').trim().toLowerCase();
            });

            const currentDoi = foundDoi?.trim().toLowerCase();
            const match = currentDoi && sheetDois.includes(currentDoi);

            const status = document.getElementById('matchIndicator');
            if (match) {
                status.textContent = '✅ DOI already labeled';
                status.style.color = 'green';
            } else if (currentDoi) {
                status.textContent = '❌ DOI not labeled yet';
                status.style.color = 'gray';
            } else {
                status.textContent = '⚠️ DOI not found on page';
                status.style.color = 'red';
            }
        })
        .catch(() => {
            const status = document.getElementById('matchIndicator');
            status.textContent = '⚠️ Error loading CSV';
            status.style.color = 'red';
        });

    const dragHandle = document.getElementById('dragHandle');
    dragHandle.onmousedown = function (e) {
        e.preventDefault();
        let shiftX = e.clientX - panel.getBoundingClientRect().left;
        let shiftY = e.clientY - panel.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            panel.style.left = (pageX - shiftX) + 'px';
            panel.style.top = (pageY - shiftY) + 'px';
            panel.style.right = 'auto';
        }

        function onMouseMove(e) {
            moveAt(e.pageX, e.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.onmouseup = function () {
            document.removeEventListener('mousemove', onMouseMove);
            document.onmouseup = null;
        };
    };
})();
