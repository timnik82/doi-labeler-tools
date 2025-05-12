# DOI Labeler Tools

## 🚀 Quick Install Links

- 🔗 [Install DOI Labeler Panel](https://timnik82.github.io/doi-labeler-tools/doi_panel_labeler.user.js)
- 🔗 [Install Google Scholar Checker](https://timnik82.github.io/doi-labeler-tools/scholar_checker.user.js)

This repository contains Tampermonkey userscripts and backend integration tools designed to support manual review and labeling of scientific articles based on their DOI and metadata. It streamlines the categorization process for researchers working with large literature datasets.

---

## 🔧 What’s Included

### 1. `doi_panel_labeler.user.js`

A floating panel that appears on any article webpage containing a DOI. It allows users to:

* Detect if the article has already been labeled (via DOI lookup in a shared Google Sheet)
* Submit a label (Yes / No)
* Select a category from a dropdown
* Automatically extract and log the article title
* Submit the DOI, label, user, timestamp, category, and title to a Google Sheet via a Google Apps Script Web App

> ✅ Robust to added columns in the spreadsheet

### 2. `scholar_checker.user.js`

Adds inline visual markers (✅ / ❌ / 🟡) next to each article title on Google Scholar search results:

* ✅ Green check: title found in sheet with label "Yes"
* ❌ Red cross: title found with label "No"
* 🟡 Yellow circle: title not found in sheet

Uses normalized titles (stripped of punctuation and case-insensitive) to improve matching.

---

## 📋 Google Sheet Integration

All scripts interact with a shared Google Sheet published as CSV and use a Web App endpoint for `POST` submission.

**Expected Sheet Columns (in order):**

1. DOI (e.g., `https://doi.org/...`)
2. Label (`Yes` or `No`)
3. Timestamp
4. User
5. Category (short label)
6. Title (original, not normalized)

---

## 🌐 Backend (Google Apps Script)

A deployed Web App script receives POST requests and appends the metadata to the spreadsheet:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.url || '',
    data.label || '',
    new Date(),
    data.user || '',
    data.category || '',
    data.title || ''
  ]);
  return ContentService.createTextOutput("OK");
}
```

---

## 🧪 Setup Instructions

1. Install Tampermonkey in your browser
2. Load the `.user.js` files into Tampermonkey
3. Share your Google Sheet and publish as CSV
4. Deploy your Google Apps Script Web App and replace the script URL in the userscripts

---

## 📌 Future Improvements

* Add fuzzy title matching
* Handle infinite scroll in Google Scholar
* Optional column normalization during submission
* Support for additional scholarly databases

---

Maintained by: Timur & collaborators

Feel free to fork, adapt, or contribute.

---

*This project is designed for academic literature review workflows. Not affiliated with Google Scholar or any journal publisher.*
