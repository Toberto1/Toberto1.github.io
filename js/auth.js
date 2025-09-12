import * as global from './globals.js';

async function submitPassword() {
  const un = document.getElementById('username').value;
  const pw = document.getElementById('password').value;
  if (un === '') {
    showError('Please enter a username.');
    return;
  }
  if (pw === '') {
    showError('Please enter a password.');
    return;
  }

  try {
    const res = await fetch(`${global.API_IP}/api/auth/mmlogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: un, password: pw })
    });

    const data = await res.json();
    if (res.ok) {
      // Save the token for later use
      localStorage.setItem('token', data.token);
      window.location.href = 'index.html';
    } else {
      showError(data.error || 'Login failed');
    }
  } catch (err) {
    showError('Network error, please try again.');
    console.error(err);
  }
}

window.submitPassword = submitPassword;

function showError(msg) {
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}
