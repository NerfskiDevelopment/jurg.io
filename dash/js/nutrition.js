window.initNutrition = function () {
    const root = document.querySelector('.nutrition-page');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = 'true';
    const error = root.querySelector('[data-nutrition-error]');
    const dateInput = root.querySelector('[data-nutrition-date]');
    const base = getServerURL().replace(/\/$/, '') + '/V1/website/';
    let loading = false;
    const headers = () => apiAuthHeaders();
    const showError = message => { if (root.isConnected) { error.textContent = message; error.hidden = false; } };
    function access(response) {
        if (response.status === 401) {
            window.location.href = 'index.html' + (getDebugMode() ? '?debug_mode=true' : '');
            throw new Error('Please sign in again.');
        }
        if (response.status === 403) throw new Error('Your account does not have access to this feature.');
    }
    async function read(path) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(base + path, { credentials: apiCredentials(), headers: headers(), signal: controller.signal });
            access(response);
            if (!response.ok) throw new Error(response.status === 404 ? 'This entry is no longer available. Refresh the page.' : 'Unable to load. Please try again.');
            return await response.text();
        } finally { clearTimeout(timeout); }
    }
    async function reload(date) {
        if (!root.isConnected || loading) return;
        loading = true;
        root.setAttribute('aria-busy', 'true');
        error.hidden = true;
        try {
            const html = await read('html/' + root.dataset.page + '?' + new URLSearchParams({ date }));
            if (!html.includes('data-init="initNutrition"')) throw new Error(root.dataset.page === 'PROFILE.HTML' ? 'Unable to refresh your health goals.' : 'Unable to refresh your food log.');
            if (root.isConnected) renderHTML(html, { scroll: 'preserve' });
        } catch (e) { showError(e.name === 'AbortError' ? 'Loading took too long. Please refresh.' : e.message); }
        finally { loading = false; root.removeAttribute('aria-busy'); }
    }
    async function save(fields) {
        // Do not abort a write: the server may already have persisted it.
        const response = await fetch(base + 'action/NUTRITION_SAVE', {
            method: 'POST', credentials: apiCredentials(), headers: { ...headers(), 'Content-Type': 'application/x-www-form-urlencoded' },
            body: fields.toString()
        });
        access(response);
        const result = await response.json();
        if (!response.ok || !result.Ok) return { ...result, Ok: false };
        return result;
    }
    async function openEditor(action, key, trigger) {
        if (loading || document.querySelector('.nutrition-dialog')) return;
        loading = true;
        error.hidden = true;
        try {
            const query = new URLSearchParams({ kind: action === 'goals' ? 'goals' : 'food', mode: action, key: key || '', date: root.dataset.date });
            const html = await read('html/NUTRITION_EDITOR.HTML?' + query);
            if (!root.isConnected) return;
            if (!html.includes('class="nutrition-form"')) throw new Error('Unable to open this entry.');
            const dialog = document.createElement('dialog');
            dialog.className = 'nutrition-dialog';
            dialog.setAttribute('aria-labelledby', 'nutrition-editor-title');
            dialog.innerHTML = html;
            document.body.appendChild(dialog);
            const form = dialog.querySelector('form');
            const initial = new URLSearchParams(new FormData(form)).toString();
            let saving = false;
            let saved = false;
            function close() {
                if (saving) return;
                if (!saved && new URLSearchParams(new FormData(form)).toString() !== initial && !confirm('Discard your unsaved changes?')) return;
                dialog.close();
            }
            dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
            dialog.addEventListener('close', () => {
                dialog.remove();
                document.body.classList.remove('nutrition-dialog-open');
                if (trigger.isConnected) trigger.focus({ preventScroll: true });
            }, { once: true });
            dialog.querySelectorAll('[data-nutrition-cancel]').forEach(button => button.addEventListener('click', close));
            form.addEventListener('input', event => {
                const field = form.querySelector(`[data-error="${CSS.escape(event.target.name || '')}"]`);
                if (field) field.hidden = true;
                event.target.removeAttribute('aria-invalid');
            });
            form.addEventListener('submit', async event => {
                event.preventDefault();
                if (saving || !form.reportValidity()) return;
                const fields = new URLSearchParams(new FormData(form));
                const buttons = [...form.querySelectorAll('button')];
                saving = true;
                dialog.setAttribute('aria-busy', 'true');
                buttons.forEach(button => button.disabled = true);
                form.querySelector('[type="submit"]').textContent = 'Saving…';
                form.querySelectorAll('[data-error]').forEach(field => field.hidden = true);
                form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
                try {
                    const result = await save(fields);
                    if (!result.Ok) {
                        for (const [name, message] of Object.entries(result.Errors || { _form: 'Unable to save. Please try again.' })) {
                            const field = form.querySelector(`[data-error="${CSS.escape(name)}"]`) || form.querySelector('[data-error="_form"]');
                            field.textContent = message;
                            field.hidden = false;
                            form.elements.namedItem(name)?.setAttribute('aria-invalid', 'true');
                        }
                        form.querySelector('[aria-invalid]')?.focus();
                        return;
                    }
                    saved = true;
                    dialog.close();
                    await reload(result.Date || root.dataset.date);
                } catch (e) {
                    const field = form.querySelector('[data-error="_form"]');
                    field.textContent = 'Could not confirm the save. You can retry, or close and refresh to check your log.';
                    field.hidden = false;
                } finally {
                    saving = false;
                    dialog.removeAttribute('aria-busy');
                    buttons.forEach(button => button.disabled = false);
                    form.querySelector('[type="submit"]').textContent = 'Save';
                }
            });
            document.body.classList.add('nutrition-dialog-open');
            dialog.showModal();
            form.querySelector('input:not([type="hidden"])')?.focus();
        } catch (e) { showError(e.name === 'AbortError' ? 'Loading took too long. Please try again.' : e.message); }
        finally { loading = false; }
    }
    root.addEventListener('click', async event => {
        const button = event.target.closest('[data-nutrition-action]');
        if (!button || !root.contains(button) || loading) return;
        const action = button.dataset.nutritionAction;
        if (action === 'refresh') { await reload(root.dataset.date); return; }
        if (action !== 'delete') { await openEditor(action, button.dataset.key, button); return; }
        if (!confirm('Remove this food from your log?')) return;
        loading = true;
        button.disabled = true;
        error.hidden = true;
        try {
            const result = await save(new URLSearchParams({ mode: 'delete', key: button.dataset.key, version: button.dataset.version }));
            if (!result.Ok) throw new Error(result.Errors?._form || 'Unable to remove this entry. Refresh and try again.');
            loading = false;
            await reload(root.dataset.date);
        } catch (e) { showError(e.message); }
        finally { loading = false; button.disabled = false; }
    });
    root.addEventListener('keydown', event => {
        const target = event.target.closest('[role="button"][data-nutrition-action]');
        if (target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); target.click(); }
    });
    dateInput?.addEventListener('change', () => {
        if (dateInput.value && dateInput.checkValidity()) reload(dateInput.value);
    });
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (root.dataset.autoDate === 'true' && root.dataset.date !== localDate) reload(localDate);
};

