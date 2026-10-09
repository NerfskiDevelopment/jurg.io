let loginBusy = false;
function showLoginError(message) {
    const error = document.getElementById('login-error');
    error.textContent = message;
    error.classList.add('visible');
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
            } else showLoginError(result);
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
    const result = await restoreLoginSession();
    // Do not interrupt a user who has started entering their credentials.
    if (result.status === 'valid' && !loginBusy && !document.getElementById('passwordInput').value && !document.getElementById('username_field').value) redirect(dashboardURL());
});
