window.initDatabaseManager = function () {
    const root = document.querySelector('.database-manager');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = 'true';
    const input = root.querySelector('[name="search"]');
    const error = root.querySelector('.db-error');

    function handleAccessChange(response) {
        if (response.status !== 401 && response.status !== 403) return false;
        setLoginPermissions(0);
        applyPermissions();
        if (response.status === 401) {
            window.location.href = 'index.html' + (getDebugMode() ? '?debug_mode=true' : '');
        } else {
            renderHTML('<section><h2>Administrator access required</h2><p>Your account no longer has access to this section.</p></section>');
        }
        return true;
    }

    async function openEditor(mode, key, trigger) {
        if (root.dataset.loading || document.querySelector('.db-editor-dialog')) return;
        root.dataset.loading = 'true';
        error.hidden = true;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const params = new URLSearchParams({ table: root.dataset.table, mode, key: key || '' });
            const response = await fetch(getServerURL() + '/V1/website/html/DATABASE_EDITOR.HTML?' + params, {
                credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal
            });
            if (handleAccessChange(response)) return;
            const html = await response.text();
            if (!response.ok || !html.includes('class="db-object-form"')) throw new Error('Unable to open the editor. Refresh the table and check your administrator login.');
            if (!root.isConnected) return;
            const dialog = document.createElement('dialog');
            dialog.className = 'db-editor-dialog';
            dialog.setAttribute('aria-labelledby', 'db-editor-title');
            dialog.innerHTML = html;
            document.body.appendChild(dialog);
            const form = dialog.querySelector('form');
            const initial = new URLSearchParams(new FormData(form)).toString();
            let saving = false;
            let saved = false;

            function closeEditor() {
                if (saving) return;
                const changed = new URLSearchParams(new FormData(form)).toString() !== initial;
                if (!saved && changed && !confirm('Discard your unsaved changes?')) return;
                dialog.close();
            }
            dialog.addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
            dialog.addEventListener('close', () => {
                dialog.remove();
                document.body.classList.remove('db-editor-open');
                if (trigger.isConnected) trigger.focus({ preventScroll: true });
            }, { once: true });
            dialog.querySelectorAll('[data-db-cancel]').forEach(button => button.addEventListener('click', closeEditor));

            const owner = form.elements.namedItem('UserID');
            const list = form.elements.namedItem('ListID');
            function filterLists() {
                if (!list) return;
                for (const option of list.options) {
                    const unavailable = option.value !== '' && option.dataset.owner !== owner.value;
                    option.hidden = unavailable;
                    option.disabled = unavailable;
                }
                if (list.selectedOptions[0]?.disabled) list.value = '';
            }
            owner?.addEventListener('change', filterLists);
            filterLists();
            form.addEventListener('input', event => {
                const name = event.target.name;
                const fieldError = form.querySelector(`[data-error="${CSS.escape(name)}"]`);
                if (fieldError) fieldError.hidden = true;
                event.target.removeAttribute('aria-invalid');
            });

            form.addEventListener('submit', async event => {
                event.preventDefault();
                if (saving || !form.reportValidity()) return;
                saving = true;
                dialog.setAttribute('aria-busy', 'true');
                const buttons = [...form.querySelectorAll('button')];
                buttons.forEach(button => button.disabled = true);
                const saveButton = form.querySelector('[type="submit"]');
                saveButton.textContent = 'Saving…';
                form.querySelectorAll('[data-error]').forEach(element => element.hidden = true);
                form.querySelectorAll('[aria-invalid]').forEach(element => element.removeAttribute('aria-invalid'));
                try {
                    const response = await fetch(getServerURL() + '/V1/website/action/DATABASE_SAVE', {
                        method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams(new FormData(form)).toString()
                    });
                    if (response.status === 401 || response.status === 403) {
                        saved = true;
                        dialog.close();
                        handleAccessChange(response);
                        return;
                    }
                    const result = await response.json();
                    if (!response.ok || !result.Ok) {
                        const errors = result.Errors || { _form: 'Unable to save. Check your administrator login.' };
                        for (const [name, message] of Object.entries(errors)) {
                            const element = form.querySelector(`[data-error="${CSS.escape(name)}"]`) || form.querySelector('[data-error="_form"]');
                            element.textContent = message;
                            element.hidden = false;
                            form.elements.namedItem(name)?.setAttribute('aria-invalid', 'true');
                        }
                        const firstError = form.querySelector('[data-error]:not([hidden])');
                        firstError?.scrollIntoView({ block: 'nearest' });
                        form.querySelector('[aria-invalid]')?.focus();
                        return;
                    }
                    saved = true;
                    dialog.close();
                    await load({ key: result.Key });
                } catch {
                    const element = form.querySelector('[data-error="_form"]');
                    element.textContent = 'The save could not be confirmed. Refresh the table before retrying to avoid creating a duplicate.';
                    element.hidden = false;
                } finally {
                    saving = false;
                    buttons.forEach(button => button.disabled = false);
                    saveButton.textContent = 'Save record';
                    dialog.removeAttribute('aria-busy');
                }
            });
            document.body.classList.add('db-editor-open');
            dialog.showModal();
            form.querySelector('input:not([type="hidden"]), textarea, select')?.focus();
        } catch (failure) {
            error.textContent = failure.name === 'AbortError' ? 'Opening the editor timed out. Try again.' : failure.message;
            error.hidden = false;
        } finally {
            clearTimeout(timeout);
            delete root.dataset.loading;
        }
    }

    async function load(changes = {}) {
        if (root.dataset.loading) return;
        const params = new URLSearchParams({ table: root.dataset.table, search: input.value, page: root.dataset.page, ...changes });
        root.dataset.loading = 'true';
        root.setAttribute('aria-busy', 'true');
        error.hidden = true;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(getServerURL() + '/V1/website/html/DATABASE.HTML?' + params, {
                credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' }, signal: controller.signal
            });
            if (handleAccessChange(response)) return;
            const html = await response.text();
            if (!response.ok || !html.includes('class="database-manager"')) throw new Error('Unable to load records.');
            if (root.isConnected) renderHTML(html, { scroll: 'preserve' });
        } catch (failure) {
            if (root.isConnected) {
                error.textContent = failure.name === 'AbortError' ? 'The request timed out. Try refreshing.'
                    : 'Unable to load records. Check your connection and administrator login.';
                error.hidden = false;
            }
        } finally {
            clearTimeout(timeout);
            delete root.dataset.loading;
            root.removeAttribute('aria-busy');
        }
    }

    root.querySelector('[data-db-search]').addEventListener('submit', event => {
        event.preventDefault();
        load({ page: '1' });
    });
    root.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button || button.disabled) return;
        if (button.hasAttribute('data-db-editor')) openEditor(button.dataset.dbEditor, button.dataset.key, button);
        else if (button.hasAttribute('data-db-table')) load({ table: button.dataset.dbTable, search: '', page: '1' });
        else if (button.hasAttribute('data-db-key')) load({ key: button.dataset.dbKey });
        else if (button.hasAttribute('data-db-page')) load({ page: button.dataset.dbPage });
        else if (button.hasAttribute('data-db-clear')) load({ search: '', page: '1' });
        else if (button.hasAttribute('data-db-refresh')) {
            const selected = root.querySelector('[data-db-key].is-active');
            load(selected ? { key: selected.dataset.dbKey } : {});
        }
    });
};
