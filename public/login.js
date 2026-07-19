
const form = document.getElementById('authForm');
const errorBox = document.getElementById('errorBox');
const submitBtn = document.getElementById('submitBtn');

const redirects = {
  admin: '/dashboard/admin',
  advertiser: '/dashboard/advertiser',
  publisher: '/dashboard/publisher',
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    // Store token so the dashboard can read it. This is a real deployed
    // app (not a claude.ai artifact preview), so localStorage is fine here.
    localStorage.setItem('eliteadx_token', data.token);
    localStorage.setItem('eliteadx_user', JSON.stringify(data.user));

    window.location.href = redirects[data.user.role] || '/login';
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});