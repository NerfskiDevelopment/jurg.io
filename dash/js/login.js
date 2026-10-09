// Cookie mode is prepared for the future API; the current API uses a tab session.
window.loginState = { username: '', permissions: 0 };
function clearLegacyLoginStorage() {
    try { ['token', 'p', 'u', 'username', 'permissions', 'authRedirect'].forEach(key => window.localStorage.removeItem(key)); } catch { }
}
function getLoginPermissions() { return window.loginState.permissions; }
function setLoginPermissions(value) { window.loginState.permissions = Number(value) || 0; }
function getLoginUsername() { return window.loginState.username; }
function loginRedirectURL() { return 'index.html' + (getDebugMode() ? '?debug_mode=true' : ''); }
function dashboardURL() { return 'dashboard.html' + (getDebugMode() ? '?debug_mode=true' : ''); }

async function authRequest(path, fields = null) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const headers = { ...apiAuthHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' };
        // Public login does not need an old bearer or a CORS preflight in legacy mode.
        if (path === '/v1/api/oauthv2' || path === '/v2/api/forgotv2') delete headers.Authorization;
        const response = await fetch(getServerURL() + path, {
            method: 'POST', credentials: apiCredentials(), signal: controller.signal,
            headers,
            body: fields ? new URLSearchParams(fields).toString() : ''
        });
        let data;
        try { data = await response.json(); } catch { throw new Error('The server returned an unexpected response. Please try again.'); }
        return { response, data };
    } finally { clearTimeout(timeout); }
}

async function restoreLoginSession() {
    if (!cookieAuthEnabled() && !getSessionBearer()) return { status: 'invalid' };
    try {
        const { response, data } = await authRequest('/v1/api/token');
        if (response.status === 401 || (response.ok && data.ERROR === 'Invalid token')) {
            window.loginState = { username: '', permissions: 0 };
            setSessionBearer('');
            return { status: 'invalid' };
        }
        if (!response.ok || data.ERROR) throw new Error('Unable to check your login. Please try again.');
        const permissions = Number(data.Permissions ?? data.MESSAGE);
        if (!Number.isInteger(permissions) || permissions < 1 || permissions > 6) throw new Error('Unable to check your login. Please try again.');
        window.loginState = { username: data.Username || '', permissions };
        clearLegacyLoginStorage();
        return { status: 'valid' };
    } catch (error) {
        return { status: 'unavailable', message: error.name === 'AbortError' ? 'Checking your login took too long. Please retry.' : error instanceof TypeError ? 'The API could not be reached or the browser blocked its connection. Your session has not been cleared. Please retry.' : error.message };
    }
}

async function login(username, password, callback) {
    try {
        const remember = document.querySelector('[name="remember"]')?.checked ?? false;
        const { response, data } = await authRequest('/v1/api/oauthv2', {
            username, password, remember: String(remember),
            tokenId: '2WtmuzuAr1d5jT7sxRA9O4vm1gxsE848loMnroDLau97PTqucgYL19CQhRqF9Kim'
        });
        if (!response.ok || data.ERROR) { callback(data.ERROR || 'Unable to sign in. Please try again.'); return; }
        if (!cookieAuthEnabled()) {
            const token = data.AuthToken?.TOKEN;
            if (!token) { callback('The server did not return a login session. Please try again.'); return; }
            setSessionBearer(token);
            window.loginState = { username: data.Username || '', permissions: Number(data.Permissions) || 0 };
            clearLegacyLoginStorage();
            // Storage may be blocked: do not redirect and silently lose the new login.
            try {
                if (sessionStorage.getItem('loginBearer') !== token) throw new Error('Session unavailable');
            } catch {
                setSessionBearer('');
                callback('Your browser is blocking site storage. Allow site data or use a regular browser tab to sign in.');
                return;
            }
            callback('CONTINUE');
            return;
        }
        // Verify the cookie actually arrived, including when browser policy blocks it.
        const restored = await restoreLoginSession();
        if (restored.status !== 'valid') {
            callback(restored.status === 'invalid' ? 'Your login could not be remembered. Cookie-based login requires the API update and cookies enabled for this site.' : restored.message);
            return;
        }
        window.loginState.username = data.Username || window.loginState.username;
        callback('CONTINUE');
    } catch (error) { callback(error.name === 'AbortError' ? 'Signing in took too long. Please retry.' : error instanceof TypeError ? 'The API could not be reached or the browser blocked its connection. Please retry.' : error.message); }
}

async function forgotlogin(username) {
    const { data } = await authRequest('/v2/api/forgotv2', { username, tokenId: '2WtmuzuAr1d5jT7sxRA9O4vm1gxsE848loMnroDLau97PTqucgYL19CQhRqF9Kim' });
    return data.CODE === 200 ? 'An email has been sent to your inbox.' : data.ERROR;
}

async function logout() {
    if (!cookieAuthEnabled()) {
        setSessionBearer('');
        window.loginState = { username: '', permissions: 0 };
        clearLegacyLoginStorage();
        redirect(loginRedirectURL());
        return;
    }
    try {
        const { response, data } = await authRequest('/v1/api/logout');
        if (!response.ok && response.status !== 401) throw new Error('Logout failed');
        if (response.status !== 401 && data.ERROR) throw new Error('Logout failed');
        window.loginState = { username: '', permissions: 0 };
        clearLegacyLoginStorage();
        redirect(loginRedirectURL());
    } catch { alert('Unable to sign out from the server. Please retry when you are connected.'); }
}

// Compatibility for pages that still call the old token-check helper.
async function checkLoginToken(_unusedToken, callback) {
    const result = await restoreLoginSession();
    callback([result.status === 'valid', getLoginPermissions(), result.status]);
}
async function loadLoginCookie() {
    const result = await restoreLoginSession();
    if (typeof applyPermissions === 'function') applyPermissions();
    if (result.status === 'invalid') redirect(loginRedirectURL());
    return result;
}
clearLegacyLoginStorage();
