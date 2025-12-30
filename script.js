const sampleToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MjAwMDAwMDAwMH0.pz_pRefsOI9vFk0DmIlabrh1c0YnVhEjW5iJY1ULYF0';

const jwtInput = document.getElementById('jwtInput');
const headerJson = document.getElementById('headerJson');
const payloadJson = document.getElementById('payloadJson');
const statusMessage = document.getElementById('statusMessage');
const secretTextarea = document.getElementById('secretTextarea');
const secretEditable = document.getElementById('secretEditable');
const verifyBtn = document.getElementById('verifyBtn');
const applyBtn = document.getElementById('applyBtn');
let secret = '';
// const unixInput = document.getElementById('unixInput');
// const localTime = document.getElementById('localTime');
// const utcTime = document.getElementById('utcTime');
// const relativeTime = document.getElementById('relativeTime');
// const dayOfYear = document.getElementById('dayOfYear');
// const weekOfYear = document.getElementById('weekOfYear');
// const isLeap = document.getElementById('isLeap');
// const expiryText = document.getElementById('expiryText');
// const issuedText = document.getElementById('issuedText');
// const timeLeftText = document.getElementById('timeLeft');

const statusIcon = statusMessage.querySelector('.status-icon');
const statusLabel = document.querySelector('.status-label');
const copyBtn = document.getElementById('copyBtn');
const pasteBtn = document.getElementById('pasteBtn');
const sampleBtn = document.getElementById('sampleBtn');
const clearBtn = document.getElementById('clearBtn');
const algoSelect = document.getElementById('algoSelect');
// const applyHeaderBtn = document.getElementById('applyHeaderBtn');
// const applyPayloadBtn = document.getElementById('applyPayloadBtn');
const datetimeModal = document.getElementById('datetimeModal');
const iatUnixInput = document.getElementById('iatUnixInput');
const expUnixInput = document.getElementById('expUnixInput');
const iatUtcInput = document.getElementById('iatUtcInput');
const expUtcInput = document.getElementById('expUtcInput');
const iatRelativeSpan = document.getElementById('iatRelativeSpan');
const expRelativeSpan = document.getElementById('expRelativeSpan');
const updateDatetimeBtn = document.getElementById('updateDatetimeBtn');
const closeModal = datetimeModal.querySelector('.close');

function base64UrlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  try {
    const replaced = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = replaced.padEnd(replaced.length + ((4 - (replaced.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return decodeURIComponent(
      decoded
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join(''),
    );
  } catch (err) {
    return null;
  }
}

async function computeSignature(data, secret) {
  if (!secret) return '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function parseJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const header = base64UrlDecode(parts[0]);
  const payload = base64UrlDecode(parts[1]);
  if (!header || !payload) return null;
  try {
    return {
      header: JSON.parse(header),
      payload: JSON.parse(payload),
      signature: parts[2] || '',
    };
  } catch (error) {
    return null;
  }
}

function updateStatus(tokenMeta) {
  if (!tokenMeta) {
    statusMessage.classList.add('invalid');
    statusIcon.textContent = '!';
    statusLabel.textContent = 'Paste a complete JWT to inspect';
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokenMeta.payload.exp && tokenMeta.payload.exp < now) {
    statusMessage.classList.add('invalid');
    statusIcon.textContent = '⨯';
    statusLabel.textContent = 'Token expired — signature stale';
  } else {
    statusMessage.classList.remove('invalid');
    statusIcon.textContent = '✔';
    statusLabel.textContent = 'Signature segments intact';
  }
}

async function updateJwt() {
  const currentToken = jwtInput.value.trim();
  const tokenMeta = parseJwt(currentToken);
  if (tokenMeta) {
    const headerEncoded = base64UrlEncode(JSON.stringify(tokenMeta.header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(tokenMeta.payload));
    const data = `${headerEncoded}.${payloadEncoded}`;
    const newSignature = await computeSignature(data, secret);
    const newToken = `${data}.${newSignature}`;
    jwtInput.value = newToken;
    updateStatus(parseJwt(newToken));
  }
}

function prettyPrint(json) {
  return JSON.stringify(json, null, 2);
}

function updateDisplay(token) {
  const tokenMeta = parseJwt(token);
  if (!tokenMeta) {
    if (headerJson !== document.activeElement) headerJson.textContent = '{ }';
    if (payloadJson !== document.activeElement) payloadJson.textContent = '{ }';
    // expiryText.textContent = '—';
    // issuedText.textContent = '—';
    // timeLeftText.content = '—';
    // setUnixField(Math.floor(Date.now() / 1000));
    // updateTimePanel(parseInt(unixInput.value, 10));
    updateStatus(null);
    return;
  }

  if (headerJson !== document.activeElement) headerJson.textContent = prettyPrint(tokenMeta.header);
  if (payloadJson !== document.activeElement) payloadJson.textContent = prettyPrint(tokenMeta.payload);

  // Update algorithm dropdown
  algoSelect.value = tokenMeta.header.alg || 'HS256';
  // if (tokenMeta.payload.exp) {
  //   expiryText.textContent = new Date(tokenMeta.payload.exp * 1000).toLocaleString();
  // } else {
  //   expiryText.textContent = '—';
  // }
  // if (tokenMeta.payload.iat) {
  //   issuedText.textContent = new Date(tokenMeta.payload.iat * 1000).toLocaleString();
  // } else {
  //   issuedText.textContent = '—';
  // }
  // if (tokenMeta.payload.exp) {
  //   timeLeftText.textContent = formatDuration(tokenMeta.payload.exp - Math.floor(Date.now() / 1000));
  //   setUnixField(tokenMeta.payload.exp);
  //   updateTimePanel(tokenMeta.payload.exp);
  // } else {
  //   timeLeftText.textContent = '—';
  //   setUnixField(Math.floor(Date.now() / 1000));
  //   updateTimePanel(parseInt(unixInput.value, 10));
  // }

  updateStatus(tokenMeta);
}

// function setUnixField(value) {
//   unixInput.value = value || '';
// }

function formatDuration(seconds) {
  if (seconds === undefined || Number.isNaN(seconds)) return '—';
  const s = Math.max(seconds, 0);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

// function updateTimePanel(value) {
//   const unix = Number(value) || Math.floor(Date.now() / 1000);
//   const date = new Date(unix * 1000);
//   localTime.textContent = date.toLocaleString();
//   utcTime.textContent = date.toISOString();
//   relativeTime.textContent = describeRelative(unix - Date.now() / 1000);
//   dayOfYear.textContent = getDayOfYear(date);
//   weekOfYear.textContent = getWeekNumber(date);
//   isLeap.textContent = isLeapYear(date.getUTCFullYear()) ? 'true' : 'false';
// }

function describeRelative(diff) {
  const prefix = diff >= 0 ? 'from now' : 'ago';
  const [abs, unit] = formatRelativePoint(Math.abs(diff));
  return `${abs} ${prefix}`;
}

function formatRelativePoint(diff) {
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (days) return [`${days}d`, ''];
  if (hours) return [`${hours}h`, ''];
  if (minutes) return [`${minutes}m`, ''];
  return [`${Math.max(Math.floor(diff % 60), 1)}s`, ''];
}

// function getDayOfYear(date) {
//   const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
//   const diff = date - start;
//   return Math.floor(diff / 86400000);
// }

// function getWeekNumber(date) {
//   const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
//   const dayNum = target.getUTCDay() || 7;
//   target.setUTCDate(target.getUTCDate() + 4 - dayNum);
//   const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
//   const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
//   return week;
// }

// function isLeapYear(year) {
//   return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
// }

function copyToClipboard(value) {
  if (!value) return;
  navigator.clipboard?.writeText(value)?.catch(() => {
    const area = document.createElement('textarea');
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  });
}

function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add('show'), 10);

  // Hide and remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.querySelectorAll('[data-copy-target]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.copyTarget;
    const element = document.getElementById(target);
    const content = element?.textContent ?? '';
    copyToClipboard(content);

    // Show appropriate toast based on what was copied
    let toastMessage = 'Copied';
    if (target === 'headerJson') {
      toastMessage = 'Header copied';
    } else if (target === 'payloadJson') {
      toastMessage = 'Payload copied';
    }
    showToast(toastMessage);

    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = 'Copy'), 1200);
  });
});

// timeCopyBtn.addEventListener('click', () => {
//   copyToClipboard(unixInput.value);
// });

// clipboardBtn.addEventListener('click', async () => {
//   try {
//     const text = await navigator.clipboard.readText();
//     jwtInput.value = text;
//     updateDisplay(text.trim());
//   } catch (err) {
//     console.warn('clipboard not accessible');
//   }
// });

sampleBtn.addEventListener('click', () => {
  jwtInput.value = sampleToken;
  updateDisplay(sampleToken);
  showToast('Sample JWT loaded');
});

clearBtn.addEventListener('click', () => {
  jwtInput.value = '';
  updateDisplay('');
  showToast('JWT cleared');
});

jwtInput.addEventListener('input', () => {
  updateDisplay(jwtInput.value.trim());
});

// Real-time update for header
headerJson.addEventListener('input', async () => {
  const newHeaderText = headerJson.textContent;
  try {
    const newHeader = JSON.parse(newHeaderText);
    const currentToken = jwtInput.value.trim();
    const tokenMeta = parseJwt(currentToken);
    if (tokenMeta) {
      const newHeaderEncoded = base64UrlEncode(JSON.stringify(newHeader));
      const payloadEncoded = base64UrlEncode(JSON.stringify(tokenMeta.payload));
      const data = `${newHeaderEncoded}.${payloadEncoded}`;
      const newSignature = await computeSignature(data, secret);
      const newToken = `${data}.${newSignature}`;
      jwtInput.value = newToken;
      // Update algorithm
      algoSelect.value = newHeader.alg || 'HS256';
      updateStatus(parseJwt(newToken));
    }
  } catch (e) {
    // Invalid JSON, do nothing
  }
});

// Real-time update for payload
payloadJson.addEventListener('input', async () => {
  const newPayloadText = payloadJson.textContent;
  try {
    const newPayload = JSON.parse(newPayloadText);
    const currentToken = jwtInput.value.trim();
    const tokenMeta = parseJwt(currentToken);
    if (tokenMeta) {
      const headerEncoded = base64UrlEncode(JSON.stringify(tokenMeta.header));
      const newPayloadEncoded = base64UrlEncode(JSON.stringify(newPayload));
      const data = `${headerEncoded}.${newPayloadEncoded}`;
      const newSignature = await computeSignature(data, secret);
      const newToken = `${data}.${newSignature}`;
      jwtInput.value = newToken;
      updateStatus(parseJwt(newToken));
    }
  } catch (e) {
    // Invalid JSON, do nothing
  }
});

// Beautify header on blur
headerJson.addEventListener('blur', () => {
  const text = headerJson.textContent;
  try {
    const parsed = JSON.parse(text);
    headerJson.textContent = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Leave as is if invalid
  }
});

// Beautify payload on blur
payloadJson.addEventListener('blur', () => {
  const text = payloadJson.textContent;
  try {
    const parsed = JSON.parse(text);
    payloadJson.textContent = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Leave as is if invalid
  }
});

// Beautify secret on blur for editable
secretEditable.addEventListener('blur', () => {
  // No beautify needed
});

// Verify button
verifyBtn.addEventListener('click', async () => {
  const currentToken = jwtInput.value.trim();
  const tokenMeta = parseJwt(currentToken);
  if (tokenMeta && tokenMeta.signature && secret) {
    const data = base64UrlEncode(JSON.stringify(tokenMeta.header)) + '.' + base64UrlEncode(JSON.stringify(tokenMeta.payload));
    try {
      const expected = await computeSignature(data, secret);
      if (expected === tokenMeta.signature) {
        statusMessage.classList.remove('invalid');
        statusIcon.textContent = '✔';
        statusLabel.textContent = 'Signature verified';
        showToast('Signature verified');
      } else {
        statusMessage.classList.add('invalid');
        statusIcon.textContent = '⨯';
        statusLabel.textContent = 'Signature invalid';
        showToast('Signature invalid');
      }
    } catch (e) {
      statusMessage.classList.add('invalid');
      statusIcon.textContent = '⨯';
      statusLabel.textContent = 'Verification failed';
      showToast('Verification failed');
    }
  } else {
    showToast('No secret or JWT to verify');
  }
});

// Apply button for secret
applyBtn.addEventListener('click', async () => {
  secret = secretTextarea.value;
  secretEditable.textContent = secret || 'your-secret';
  await updateJwt();
  showToast('Secret applied');
});

// Eye button listeners
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tokenMeta = parseJwt(jwtInput.value.trim());
    if (tokenMeta && tokenMeta.payload) {
      const iat = tokenMeta.payload.iat || Math.floor(Date.now() / 1000);
      const exp = tokenMeta.payload.exp || Math.floor(Date.now() / 1000) + 3600;
      iatUnixInput.value = iat;
      expUnixInput.value = exp;
      updateModalFields();
      datetimeModal.style.display = 'block';
    }
  });
});

// Close modal
closeModal.addEventListener('click', () => {
  datetimeModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === datetimeModal) {
    datetimeModal.style.display = 'none';
  }
});

// Update modal fields
function updateModalFields() {
  const iat = parseInt(iatUnixInput.value, 10);
  const exp = parseInt(expUnixInput.value, 10);
  if (!isNaN(iat)) {
    const date = new Date(iat * 1000);
    iatUtcInput.value = date.toISOString();
    iatRelativeSpan.textContent = describeRelative(iat - Date.now() / 1000);
  }
  if (!isNaN(exp)) {
    const date = new Date(exp * 1000);
    expUtcInput.value = date.toISOString();
    expRelativeSpan.textContent = describeRelative(exp - Date.now() / 1000);
  }
}

// Unix input changes
iatUnixInput.addEventListener('input', updateModalFields);
expUnixInput.addEventListener('input', updateModalFields);

// Update button
updateDatetimeBtn.addEventListener('click', async () => {
  const iat = parseInt(iatUnixInput.value, 10);
  const exp = parseInt(expUnixInput.value, 10);
  const tokenMeta = parseJwt(jwtInput.value.trim());
  if (tokenMeta) {
    const newPayload = { ...tokenMeta.payload };
    if (!isNaN(iat)) newPayload.iat = iat;
    if (!isNaN(exp)) newPayload.exp = exp;
    payloadJson.textContent = JSON.stringify(newPayload, null, 2);
    // Trigger the update
    await updateJwt();
    datetimeModal.style.display = 'none';
  }
});

// Update algorithm dropdown when changed
algoSelect.addEventListener('change', async () => {
  const currentToken = jwtInput.value.trim();
  const tokenMeta = parseJwt(currentToken);
  if (tokenMeta) {
    const newHeader = { ...tokenMeta.header, alg: algoSelect.value };
    headerJson.textContent = JSON.stringify(newHeader, null, 2);
    const newHeaderEncoded = base64UrlEncode(JSON.stringify(newHeader));
    const payloadEncoded = base64UrlEncode(JSON.stringify(tokenMeta.payload));
    const data = `${newHeaderEncoded}.${payloadEncoded}`;
    const newSignature = await computeSignature(data, secret);
    const newToken = `${data}.${newSignature}`;
    jwtInput.value = newToken;
    updateStatus(parseJwt(newToken));
  }
});

// Copy button functionality
copyBtn.addEventListener('click', () => {
  if (jwtInput.value.trim()) {
    copyToClipboard(jwtInput.value.trim());
    showToast('JWT copied to clipboard');
  } else {
    showToast('Nothing to copy');
  }
});

// Paste button functionality
pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    jwtInput.value = text;
    updateDisplay(text.trim());
    showToast('JWT pasted from clipboard');
  } catch (err) {
    showToast('Failed to paste from clipboard');
  }
});

// unixInput.addEventListener('input', () => {
//   updateTimePanel(unixInput.value);
// });

window.addEventListener('DOMContentLoaded', () => {
  updateDisplay(sampleToken);
  jwtInput.value = sampleToken;

  // Eye button listeners
  if (!window.eyeListenerAttached) {
    document.querySelectorAll('.eye-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tokenMeta = parseJwt(jwtInput.value.trim());
        if (tokenMeta && tokenMeta.payload) {
          const iat = tokenMeta.payload.iat || Math.floor(Date.now() / 1000);
          const exp = tokenMeta.payload.exp || Math.floor(Date.now() / 1000) + 3600;
          iatUnixInput.value = iat;
          expUnixInput.value = exp;
          updateModalFields();
          datetimeModal.style.display = 'block';
        }
      });
    });
    window.eyeListenerAttached = true;
  }

  // Close modal
  if (!window.closeListenerAttached) {
    closeModal.addEventListener('click', () => {
      datetimeModal.style.display = 'none';
    });
    window.closeListenerAttached = true;
  }

  if (!window.windowClickAttached) {
    window.addEventListener('click', (event) => {
      if (event.target === datetimeModal) {
        datetimeModal.style.display = 'none';
      }
    });
    window.windowClickAttached = true;
  }

  // Unix input changes
  if (!window.iatsInputAttached) {
    iatUnixInput.addEventListener('input', updateModalFields);
    window.iatsInputAttached = true;
  }
  if (!window.expInputAttached) {
    expUnixInput.addEventListener('input', updateModalFields);
    window.expInputAttached = true;
  }

  // UTC input changes
  if (!window.iatUtcAttached) {
    iatUtcInput.addEventListener('input', () => {
      const date = new Date(iatUtcInput.value);
      if (!isNaN(date.getTime())) {
        const unix = Math.floor(date.getTime() / 1000);
        iatUnixInput.value = unix;
        updateModalFields();
      }
    });
    window.iatUtcAttached = true;
  }
  if (!window.expUtcAttached) {
    expUtcInput.addEventListener('input', () => {
      const date = new Date(expUtcInput.value);
      if (!isNaN(date.getTime())) {
        const unix = Math.floor(date.getTime() / 1000);
        expUnixInput.value = unix;
        updateModalFields();
      }
    });
    window.expUtcAttached = true;
  }

  // Update button
  if (!window.updateBtnAttached) {
    updateDatetimeBtn.addEventListener('click', () => {
      const iat = parseInt(iatUnixInput.value, 10);
      const exp = parseInt(expUnixInput.value, 10);
      const tokenMeta = parseJwt(jwtInput.value.trim());
      if (tokenMeta) {
        const newPayload = { ...tokenMeta.payload };
        if (!isNaN(iat)) newPayload.iat = iat;
        if (!isNaN(exp)) newPayload.exp = exp;
        payloadJson.textContent = JSON.stringify(newPayload, null, 2);
        // Trigger the input listener to update JWT
        payloadJson.dispatchEvent(new Event('input'));
        datetimeModal.style.display = 'none';
      }
    });
    window.updateBtnAttached = true;
  }
});
