const sampleToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTYzMDY2MjIxNX0.pz_pRefsOI9vFk0DmIlabrh1c0YnVhEjW5iJY1ULYF0';

const jwtInput = document.getElementById('jwtInput');
const headerJson = document.getElementById('headerJson');
const payloadJson = document.getElementById('payloadJson');
const statusMessage = document.getElementById('statusMessage');
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
const clipboardBtn = document.getElementById('clipboardBtn');
const sampleBtn = document.getElementById('sampleBtn');
const clearBtn = document.getElementById('clearBtn');
// const timeCopyBtn = document.getElementById('timeCopy');

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
    statusLabel.textContent = 'Signature segments intact (mock verify)';
  }
}

function prettyPrint(json) {
  return JSON.stringify(json, null, 2);
}

function updateDisplay(token) {
  const tokenMeta = parseJwt(token);
  if (!tokenMeta) {
    headerJson.textContent = '{ }';
    payloadJson.textContent = '{ }';
    // expiryText.textContent = '—';
    // issuedText.textContent = '—';
    // timeLeftText.textContent = '—';
    // setUnixField(Math.floor(Date.now() / 1000));
    // updateTimePanel(parseInt(unixInput.value, 10));
    updateStatus(null);
    return;
  }

  headerJson.textContent = prettyPrint(tokenMeta.header);
  payloadJson.textContent = prettyPrint(tokenMeta.payload);
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

// function formatDuration(seconds) {
//   if (seconds === undefined || Number.isNaN(seconds)) return '—';
//   const s = Math.max(seconds, 0);
//   const days = Math.floor(s / 86400);
//   const hours = Math.floor((s % 86400) / 3600);
//   const minutes = Math.floor((s % 3600) / 60);
//   const secs = Math.floor(s % 60);
//   const parts = [];
//   if (days) parts.push(`${days}d`);
//   if (hours) parts.push(`${hours}h`);
//   if (minutes) parts.push(`${minutes}m`);
//   parts.push(`${secs}s`);
//   return parts.join(' ');
// }

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

// function describeRelative(diff) {
//   const prefix = diff >= 0 ? 'from now' : 'ago';
//   const [abs, unit] = formatRelativePoint(Math.abs(diff));
//   return `${abs} ${prefix}`;
// }

// function formatRelativePoint(diff) {
//   const days = Math.floor(diff / 86400);
//   const hours = Math.floor((diff % 86400) / 3600);
//   const minutes = Math.floor((diff % 3600) / 60);
//   if (days) return [`${days}d`, ''];
//   if (hours) return [`${hours}h`, ''];
//   if (minutes) return [`${minutes}m`, ''];
//   return [`${Math.max(Math.floor(diff % 60), 1)}s`, ''];
// }

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

document.querySelectorAll('[data-copy-target]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.copyTarget;
    const element = document.getElementById(target);
    copyToClipboard(element?.textContent ?? '');
    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = 'Copy'), 1200);
  });
});

// timeCopyBtn.addEventListener('click', () => {
//   copyToClipboard(unixInput.value);
// });

clipboardBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    jwtInput.value = text;
    updateDisplay(text.trim());
  } catch (err) {
    console.warn('clipboard not accessible');
  }
});

sampleBtn.addEventListener('click', () => {
  jwtInput.value = sampleToken;
  updateDisplay(sampleToken);
});

clearBtn.addEventListener('click', () => {
  jwtInput.value = '';
  updateDisplay('');
});

jwtInput.addEventListener('input', () => {
  updateDisplay(jwtInput.value.trim());
});

// unixInput.addEventListener('input', () => {
//   updateTimePanel(unixInput.value);
// });

window.addEventListener('DOMContentLoaded', () => {
  updateDisplay(sampleToken);
});
