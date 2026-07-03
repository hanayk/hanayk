javascript:(function(){
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
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const INTERNAL_TITLE_SELECTOR = 'textarea[aria-label="Internal title"]';
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'case-updater-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; justify-content: center;
    align-items: center; z-index: 999999;
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white; border-radius: 8px; padding: 20px; width: 420px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
  `;
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  modal.innerHTML = `
    <div style="background: #f0f8ff; padding: 8px; border-radius: 4px; margin-bottom: 12px; font-size: 12px;">
      🎯 Internal Title Updater
    </div>
    <label style="display:block; margin-top: 10px; font-size: 12px; color: #333; font-weight: bold;">
      Case code → definition
    </label>
    <select id="codeSelect" style="width: 100%; padding: 6px; box-sizing: border-box; margin-top: 4px;">
      <option value="">-- Select a code --</option>
    </select>
    
    <label style="display:block; margin-top: 10px; font-size: 12px; color: #333; font-weight: bold;">
      📅 Next Contact Date (Optional)
    </label>
    <input id="dateInput" type="date" value="${todayStr}" min="${todayStr}" style="width: 100%; padding: 6px; box-sizing: border-box; margin-top: 4px;" />
    <div style="font-size: 12px; color: #666; margin-top: 4px;">
      Format in string: NC: DD-Month (e.g., NC: 04-July)
    </div>
    
    <label style="display:block; margin-top: 10px; font-size: 12px; color: #666;">
      <input id="preserveRest" type="checkbox" /> Replace only leading code (preserve the rest)
    </label>
    
    <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
      <input id="previewBox" type="text" readonly placeholder="Preview will appear here" style="flex: 1; padding: 6px; box-sizing: border-box;" />
      <button id="copyBtn" style="padding: 6px 12px; cursor: pointer;">Copy</button>
    </div>
    
    <div style="display: flex; gap: 8px; margin-top: 10px;">
      <button id="applyBtn" style="flex: 1; padding: 8px 12px; cursor: pointer; background: #0078d4; color: white; border: none; border-radius: 4px;">Apply</button>
      <button id="previewBtn" style="flex: 1; padding: 8px 12px; cursor: pointer; background: #107c10; color: white; border: none; border-radius: 4px;">Preview</button>
      <button id="closeBtn" style="flex: 1; padding: 8px 12px; cursor: pointer; background: #d13438; color: white; border: none; border-radius: 4px;">Close</button>
    </div>
    
    <div id="status" style="font-size: 12px; color: #666; margin-top: 8px;"></div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const codeSelect = document.getElementById('codeSelect');
  const dateInput = document.getElementById('dateInput');
  const previewBox = document.getElementById('previewBox');
  const copyBtn = document.getElementById('copyBtn');
  const applyBtn = document.getElementById('applyBtn');
  const previewBtn = document.getElementById('previewBtn');
  const closeBtn = document.getElementById('closeBtn');
  const status = document.getElementById('status');
  const preserveRest = document.getElementById('preserveRest');
  
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
  
  function buildPreview(code, def, selectedDate, preserve, currentValue) {
    let rest = '';
    if (preserve && currentValue) {
      const codePattern = Object.keys(mapping).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const leadingRegex = new RegExp('^\\s*(' + codePattern + ')\\s*(?:[-:]+\\s*)?(.*)$', 'i');
      const m = currentValue.match(leadingRegex);
      if (m && m[2] !== undefined) {
        rest = m[2].trim();
      } else if (currentValue.trim()) {
        rest = currentValue.trim();
      }
    }
    
    let newValue = code + ' - ' + def + (rest ? ' ' + rest : '');
    
    if (selectedDate) {
      const date = new Date(selectedDate + 'T00:00:00');
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthNames[date.getMonth()];
      newValue += ' | NC: ' + day + '-' + month;
    }
    
    return newValue;
  }
  
  previewBtn.addEventListener('click', () => {
    if (!codeSelect.value) {
      showStatus('Please select a case code', true);
      return;
    }
    
    const code = codeSelect.value;
    const def = mapping[code];
    const selectedDate = dateInput.value || '';
    
    // Get current value from page if exists
    let currentValue = '';
    try {
      const els = document.querySelectorAll(INTERNAL_TITLE_SELECTOR);
      if (els.length > 0) {
        currentValue = els[0].value || '';
      }
    } catch (e) {}
    
    const preview = buildPreview(code, def, selectedDate, preserveRest.checked, currentValue);
    previewBox.value = preview;
    showStatus('Preview ready');
  });
  
  copyBtn.addEventListener('click', () => {
    const text = previewBox.value || '';
    if (!text) {
      showStatus('Nothing to copy. Generate a preview first.', true);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showStatus('Copied to clipboard');
    }).catch(() => {
      previewBox.select();
      document.execCommand('copy');
      showStatus('Copied to clipboard');
    });
  });
  
  applyBtn.addEventListener('click', () => {
    if (!codeSelect.value) {
      showStatus('Please select a case code', true);
      return;
    }
    
    showStatus('Applying...');
    const code = codeSelect.value;
    const def = mapping[code];
    const selectedDate = dateInput.value || '';
    
    try {
      const els = document.querySelectorAll(INTERNAL_TITLE_SELECTOR);
      if (!els.length) {
        showStatus('Internal title field not found on this page', true);
        return;
      }
      
      let modified = 0;
      els.forEach(el => {
        const currentValue = el.value || '';
        const preview = buildPreview(code, def, selectedDate, preserveRest.checked, currentValue);
        el.value = preview;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        modified++;
      });
      
      previewBox.value = buildPreview(code, def, selectedDate, preserveRest.checked, '');
      showStatus(`Updated ${modified} element(s)`);
    } catch (err) {
      showStatus('Error: ' + err.message, true);
    }
  });
  
  closeBtn.addEventListener('click', () => {
    overlay.remove();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
})();
