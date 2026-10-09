let loginBusy = false;
function showLoginError(message) {
    const error = document.getElementById('login-error');
    error.textContent = message;
    error.classList.add('visible');
}
function showLoginConnectionCheck() {
    const error = document.getElementById('login-error');
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = 'Check connection';
    retry.style.display = 'block'; retry.style.marginTop = '12px';
    retry.style.minHeight = '44px';
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    const version = document.createElement('small');
    version.textContent = 'Login version 20261008-3';
    retry.addEventListener('click', async () => {
        retry.disabled = true;
        status.textContent = 'Checking the sign-in service…';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
            // Read-only public root; a 404 still proves the API is reachable.
            const response = await fetch(getServerURL() + '/', { method: 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal });
            status.textContent = response.status >= 500
                ? 'The sign-in service is responding with a server error. Please try again later.'
                : 'The sign-in service is reachable. Please retry login. If it still fails, share the error shown above.';
        } catch {
            status.textContent = 'This browser cannot reach the sign-in service. Try Wi-Fi instead of mobile data (or the reverse), and check whether a VPN or content blocker is blocking api.jurg.io.';
        } finally { clearTimeout(timer); retry.disabled = false; }
    });
    error.append(retry, status, version);
}
async function login_clicked() {
    if (loginBusy) return;
    loginBusy = true;
    const button = document.querySelector('.login-submit');
    if (button) button.disabled = true;
    showLoginError('Signing in…');
    const username = document.getElementById('username_field').value;
    const password = document.getElementById('passwordInput').value;
    try {
        await login(username, password, result => {
            if (result === 'CONTINUE') {
                document.getElementById('passwordInput').value = '';
                redirect(dashboardURL());
            } else { showLoginError(result); showLoginConnectionCheck(); }
        });
    } finally { loginBusy = false; if (button) button.disabled = false; }
}
async function forgotPassword() {
    const username = document.getElementById('username_field').value;
    if (!username) { showLoginError('Enter your username.'); return; }
    showLoginError('Loading…');
    try { showLoginError(await forgotlogin(username)); } catch { showLoginError('Unable to reach the server. Please try again.'); }
}
function getDebugMode() { return new URLSearchParams(window.location.search).has('debug_mode'); }
window.addEventListener('load', async () => {
    const rememberRow = document.querySelector('.remember-row');
    if (rememberRow) {
        rememberRow.hidden = !cookieAuthEnabled();
        rememberRow.style.display = cookieAuthEnabled() ? '' : 'none';
    }
    const result = await restoreLoginSession();
    // Do not interrupt a user who has started entering their credentials.
    if (result.status === 'valid' && !loginBusy && !document.getElementById('passwordInput').value && !document.getElementById('username_field').value) redirect(dashboardURL());
});
