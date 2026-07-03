// Hardcoded selector for Dynamics 365 Internal Title field
const INTERNAL_TITLE_SELECTOR = 'textarea[aria-label="Internal title"]';

// Mapping of codes → definitions (from your list)
const mapping = {
  "WBUG": "Pending Bug",
  "WICM": "Pending ICM",
  "WPTA": "Waiting on PTL",
  "WSEE": "Waiting on MS EE's",
  "UNSU": "Unsupported scenario/out of scope",
  "DUPL": "Duplicate case",
  "WCOL": "Awaiting collaboration",
  "TRNF": "Transferred to other MS",
  "WOCT": "Waiting on Customer",
  "WOSE": "Waiting on Support Engineer",
  "WOEE": "Waiting on EE",
  "WOTA": "Waiting on Technical Advisor",
  "MOTR": "Case on Monitoring",
  "UNRC": "Unresponsive Customer",
  "TREC": "Pending technical Recovery",
  "MREC": "Pending manager Recovery",
  "RTCL": "Ready to Close"
};

// Month names
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const codeSelect = document.getElementById('codeSelect');
const dateInput = document.getElementById('dateInput');
const applyBtn = document.getElementById('apply');
const previewBtn = document.getElementById('preview');
const status = document.getElementById('status');
const previewBox = document.getElementById('previewBox');
const copyBtn = document.getElementById('copyBtn');

// Set default date to today
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInput.value = `${yyyy}-${mm}-${dd}`;

// Disable past dates
dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);

// Populate dropdown
Object.entries(mapping).forEach(([code, def]) => {
  const opt = document.createElement('option');
  opt.value = code;
  opt.textContent = `${code} — ${def}`;
  codeSelect.appendChild(opt);
});

function showStatus(msg, isError = false) {
  status.textContent = msg;
  status.style.color = isError ? '#a00' : '#060';
}

// Compute preview for the first matched element on the page (does NOT modify the DOM)
async function computePreviewOnPage(code, def, preserveRest, selectedDate) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found');

  const resp = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (selector, code, def, preserveRest, selectedDate, allCodes, monthNamesArray) => {
      const codePattern = Object.keys(allCodes).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const leadingRegex = new RegExp('^\\s*(' + codePattern + ')\\s*(?:[-:]+\\s*)?(.*)$', 'i');

      let els;
      try {
        els = Array.from(document.querySelectorAll(selector));
      } catch (e) {
        return { success: false, error: 'Invalid selector: ' + e.message };
      }
      if (!els.length) return { success: false, error: 'Internal title field not found on this page' };

      const el = els[0];
      const isInput = ('value' in el) && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !el.isContentEditable;
      const current = isInput ? (el.value || '') : (el.textContent || '');
      let rest = '';
      const m = current.match(leadingRegex);
      if (m && m[2] !== undefined) {
        rest = m[2].trim();
      } else {
        rest = '';
      }

      let newValue;
      if (preserveRest) {
        newValue = code + ' - ' + def + (rest ? ' ' + rest : '');
        if (!m && current.trim()) {
          newValue = code + ' - ' + def + ' ' + current.trim();
        }
      } else {
        newValue = code + ' - ' + def;
      }
      
      // Add date if selected
      if (selectedDate) {
        const date = new Date(selectedDate + 'T00:00:00');
        const day = String(date.getDate()).padStart(2, '0');
        const month = monthNamesArray[date.getMonth()];
        newValue += ' | NC: ' + day + '-' + month;
      }

      return { success: true, preview: newValue, original: current };
    },
    args: [INTERNAL_TITLE_SELECTOR, code, def, preserveRest, selectedDate, mapping, monthNames]
  });

  return resp?.[0]?.result;
}

// Apply changes to internal title
async function applyUpdateOnPage(code, def, preserveRest, selectedDate) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found');

  const resp = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (selector, code, def, preserveRest, selectedDate, allCodes, monthNamesArray) => {
      function applyToElement(el, newValue) {
        const isInput = ('value' in el) && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !el.isContentEditable;
        if (isInput) {
          el.value = newValue;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (el.isContentEditable) {
          el.textContent = newValue;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.textContent = newValue;
        }
      }

      const codePattern = Object.keys(allCodes).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const leadingRegex = new RegExp('^\\s*(' + codePattern + ')\\s*(?:[-:]+\\s*)?(.*)$', 'i');

      let els;
      try {
        els = Array.from(document.querySelectorAll(selector));
      } catch (e) {
        return { success: false, error: 'Invalid selector: ' + e.message };
      }
      if (!els.length) return { success: false, error: 'Internal title field not found on this page' };

      let modified = 0;
      els.forEach(el => {
        const isInput = ('value' in el) && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !el.isContentEditable;
        const current = isInput ? (el.value || '') : (el.textContent || '');
        let rest = '';
        const m = current.match(leadingRegex);
        if (m && m[2] !== undefined) {
          rest = m[2].trim();
        } else {
          rest = '';
        }

        let newValue;
        if (preserveRest) {
          newValue = code + ' - ' + def + (rest ? ' ' + rest : '');
          if (!m && current.trim()) {
            newValue = code + ' - ' + def + ' ' + current.trim();
          }
        } else {
          newValue = code + ' - ' + def;
        }
        
        // Add date if selected
        if (selectedDate) {
          const date = new Date(selectedDate + 'T00:00:00');
          const day = String(date.getDate()).padStart(2, '0');
          const month = monthNamesArray[date.getMonth()];
          newValue += ' | NC: ' + day + '-' + month;
        }

        applyToElement(el, newValue);
        modified++;
      });

      return { success: true, modified };
    },
    args: [INTERNAL_TITLE_SELECTOR, code, def, preserveRest, selectedDate, mapping, monthNames]
  });

  return resp?.[0]?.result;
}

applyBtn.addEventListener('click', async () => {
  showStatus('Applying...');
  const code = codeSelect.value;
  const def = mapping[code];
  const preserve = document.getElementById('preserveRest').checked;
  const selectedDate = dateInput.value || '';

  try {
    const res = await applyUpdateOnPage(code, def, preserve, selectedDate);
    if (!res) {
      showStatus('No response from content script', true);
    } else if (!res.success) {
      showStatus('Error: ' + res.error, true);
    } else {
      showStatus(`Updated ${res.modified} element(s)`);
      // refresh preview after apply
      try {
        const p = await computePreviewOnPage(code, def, preserve, selectedDate);
        if (p && p.success) previewBox.value = p.preview;
      } catch (e) { /* ignore preview refresh errors */ }
    }
  } catch (err) {
    showStatus('Failed: ' + err.message, true);
  }
});

previewBtn.addEventListener('click', async () => {
  showStatus('Computing preview...');
  const code = codeSelect.value;
  const def = mapping[code];
  const preserve = document.getElementById('preserveRest').checked;
  const selectedDate = dateInput.value || '';

  try {
    const res = await computePreviewOnPage(code, def, preserve, selectedDate);
    if (!res) {
      showStatus('No response from page', true);
    } else if (!res.success) {
      showStatus('Error: ' + res.error, true);
      previewBox.value = '';
    } else {
      previewBox.value = res.preview || '';
      showStatus('Preview ready');
    }
  } catch (err) {
    showStatus('Failed: ' + err.message, true);
  }
});

copyBtn.addEventListener('click', async () => {
  const text = previewBox.value || '';
  if (!text) {
    showStatus('Nothing to copy. Generate a preview first.', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showStatus('Copied to clipboard');
  } catch (err) {
    // fallback for older browsers: select and execCommand
    try {
      previewBox.select();
      document.execCommand('copy');
      showStatus('Copied to clipboard');
    } catch (e) {
      showStatus('Copy failed: ' + err.message, true);
    }
  }
});
