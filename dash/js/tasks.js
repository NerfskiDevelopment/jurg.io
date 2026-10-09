window.initTaskPage = function () {
    const root = document.querySelector('.tasks-page');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = 'true';
    const rows = [...root.querySelectorAll('.task-item')];
    const error = root.querySelector('[data-task-error]');
    const search = root.querySelector('#tasks-search-input');
    const sort = root.querySelector('#tasks-sort');
    const base = getServerURL().replace(/\/$/, '') + '/V1/website/';
    const state = window.taskPageRestore || { filter: 'all', list: '', view: 'open', search: '', sort: 'date' };
    delete window.taskPageRestore;
    let busy = false;
    const now = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    const showError = message => { if (root.isConnected) { error.textContent = message; error.hidden = false; } };
    function setBusy(value) {
        busy = value;
        root.toggleAttribute('aria-busy', value);
        root.querySelectorAll('button').forEach(button => button.disabled = value);
        rows.forEach(row => row.querySelector('[data-task-complete]').disabled = value || row.dataset.hidden === 'true');
    }
    const headers = () => ({ 'X-Requested-With': 'XMLHttpRequest' });
    function access(response) {
        if (response.status === 401) {
            window.location.href = 'index.html' + (getDebugMode() ? '?debug_mode=true' : '');
            throw new Error('Please sign in again.');
        }
        if (response.status === 403) throw new Error('Your account does not have access to this feature.');
    }
    async function read(path) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(base + path, { credentials: 'include', headers: headers(), signal: controller.signal });
            access(response);
            if (!response.ok) throw new Error(response.status === 404 ? 'This record is unavailable. Refresh the page.' : 'Unable to load. Please try again.');
            return await response.text();
        } finally { clearTimeout(timer); }
    }
    async function reload(open = '') {
        if (!root.isConnected) return false;
        setBusy(true);
        error.hidden = true;
        try {
            const query = new URLSearchParams({ date: now().slice(0, 10), open });
            const html = await read('html/TASKS.HTML?' + query);
            if (!html.includes('class="tasks-page"')) throw new Error('Unable to refresh your tasks.');
            if (root.isConnected) {
                window.taskPageRestore = { ...state };
                renderHTML(html, { scroll: 'preserve' });
            }
            return true;
        } catch (e) { showError(e.name === 'AbortError' ? 'Loading took too long. Please refresh.' : e.message); return false; }
        finally { setBusy(false); }
    }
    async function save(fields) {
        fields.set('now', now());
        const response = await fetch(base + 'action/TASK_SAVE', {
            method: 'POST', credentials: 'include', headers: { ...headers(), 'Content-Type': 'application/x-www-form-urlencoded' }, body: fields.toString()
        });
        access(response);
        const result = await response.json();
        return { ...result, Ok: response.ok && result.Ok };
    }
    function matches(row, filter = state.filter, list = state.list) {
        const due = row.dataset.due.slice(0, 10);
        if (filter === 'list') return row.dataset.list === list;
        if (filter === 'today') return due === root.dataset.date;
        if (filter === 'overdue') return due < root.dataset.date;
        if (filter === 'priority') return row.dataset.priority === 'High';
        if (filter === 'unlisted') return row.dataset.list === '';
        return true;
    }
    function updateView() {
        const filterButton = [...root.querySelectorAll('[data-task-filter]')].find(button =>
            button.dataset.taskFilter === state.filter && (state.filter !== 'list' || button.dataset.listId === state.list));
        if (!filterButton) { state.filter = 'all'; state.list = ''; }
        root.querySelectorAll('[data-task-filter]').forEach(button => {
            const active = button.dataset.taskFilter === state.filter && (state.filter !== 'list' || button.dataset.listId === state.list);
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active);
        });
        root.querySelector('#tasks-current-list-title').textContent = filterButton?.dataset.listName || filterButton?.querySelector('.tasks-list-name')?.textContent ||
            ({ all:'All tasks', today:'Today', overdue:'Past due', priority:'High priority', unlisted:'No list' }[state.filter] || 'All tasks');
        const query = state.search.trim().toLocaleLowerCase();
        const matching = rows.filter(row => matches(row) && `${row.dataset.name} ${row.dataset.description} ${row.dataset.listName}`.toLocaleLowerCase().includes(query));
        const counts = { open:0, completed:0, removed:0 };
        const status = row => row.dataset.hidden === 'true' ? 'removed' : row.dataset.completed === 'true' ? 'completed' : 'open';
        matching.forEach(row => counts[status(row)]++);
        rows.forEach(row => row.hidden = !matching.includes(row) || status(row) !== state.view);
        root.querySelectorAll('[data-view]').forEach(button => {
            button.querySelector('span').textContent = counts[button.dataset.view];
            button.classList.toggle('active', state.view === button.dataset.view);
            button.setAttribute('aria-pressed', state.view === button.dataset.view);
        });
        const rank = { High:0, Normal:1, Low:2 };
        function compare(a, b) {
            if (state.sort === 'name') return a.dataset.name.localeCompare(b.dataset.name);
            if (state.sort === 'priority') return (rank[a.dataset.priority] ?? 1) - (rank[b.dataset.priority] ?? 1) || a.dataset.due.localeCompare(b.dataset.due);
            return a.dataset.due.localeCompare(b.dataset.due) * (state.sort === 'date-desc' ? -1 : 1);
        }
        root.querySelectorAll('[data-task-group]').forEach(group => {
            const items = group.querySelector('.tasks-items');
            [...items.children].sort(compare).forEach(row => items.appendChild(row));
            const visible = [...items.children].filter(row => !row.hidden).length;
            group.hidden = visible === 0;
            group.querySelector('[data-group-count]').textContent = `${visible} task${visible === 1 ? '' : 's'}`;
        });
        root.querySelector('.tasks-empty').hidden = counts[state.view] !== 0;
        root.querySelector('.tasks-results-count').textContent = `${counts[state.view]} ${state.view} task${counts[state.view] === 1 ? '' : 's'}`;
        const total = counts.open + counts.completed;
        const percent = total ? Math.round(counts.completed / total * 100) : 0;
        root.querySelector('[data-task-progress-label]').textContent = `${counts.completed} of ${total} tasks completed in this selection.`;
        root.querySelector('[data-task-progress-percent]').textContent = percent + '%';
        root.querySelector('[data-task-progress-bar]').style.width = percent + '%';
        const openRows = rows.filter(row => status(row) === 'open');
        root.querySelectorAll('[data-filter-count]').forEach(element => element.textContent = openRows.filter(row => matches(row, element.dataset.filterCount, '')).length);
        root.querySelectorAll('[data-list-count]').forEach(element => element.textContent = openRows.filter(row => row.dataset.list === element.dataset.listCount).length);
    }
    async function openEditor(mode, kind, key, trigger) {
        if (busy || document.querySelector('.tasks-editor-dialog')) return;
        setBusy(true); error.hidden = true;
        try {
            const query = new URLSearchParams({ mode, kind, key:key || '', list:state.filter === 'list' ? state.list : '', now:now() });
            const html = await read('html/TASK_EDITOR.HTML?' + query);
            if (!root.isConnected) return;
            if (!html.includes('class="tasks-editor-form"')) throw new Error('Unable to open the editor.');
            const dialog = document.createElement('dialog');
            dialog.className = 'tasks-editor-dialog'; dialog.setAttribute('aria-labelledby','tasks-editor-title');
            dialog.innerHTML = html; document.body.appendChild(dialog);
            const form = dialog.querySelector('form');
            const initial = new URLSearchParams(new FormData(form)).toString();
            let saving = false, saved = false;
            function close() {
                if (saving) return;
                if (!saved && initial !== new URLSearchParams(new FormData(form)).toString() && !confirm('Discard your unsaved changes?')) return;
                dialog.close();
            }
            dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
            dialog.addEventListener('close', () => {
                dialog.remove(); document.body.classList.remove('tasks-editor-open');
                if (trigger?.isConnected) trigger.focus({ preventScroll: true });
            }, { once:true });
            dialog.querySelectorAll('[data-task-cancel]').forEach(button => button.addEventListener('click',close));
            form.addEventListener('input', event => {
                const field = form.querySelector(`[data-error="${CSS.escape(event.target.name || '')}"]`);
                if (field) field.hidden = true;
                event.target.removeAttribute('aria-invalid');
            });
            form.addEventListener('submit', async event => {
                event.preventDefault();
                if (saving || !form.reportValidity()) return;
                const fields = new URLSearchParams(new FormData(form));
                saving = true; dialog.setAttribute('aria-busy','true');
                const buttons = [...form.querySelectorAll('button')];
                buttons.forEach(button => button.disabled = true);
                form.querySelector('[type="submit"]').textContent = 'Saving…';
                form.querySelectorAll('[data-error]').forEach(field => field.hidden = true);
                form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
                try {
                    const result = await save(fields);
                    if (!result.Ok) {
                        for (const [name,message] of Object.entries(result.Errors || { _form:'Unable to save.' })) {
                            const field = form.querySelector(`[data-error="${CSS.escape(name)}"]`) || form.querySelector('[data-error="_form"]');
                            field.textContent = message; field.hidden = false;
                            form.elements.namedItem(name)?.setAttribute('aria-invalid','true');
                        }
                        form.querySelector('[aria-invalid]')?.focus(); return;
                    }
                    saved = true; dialog.close();
                    if (kind === 'task' && mode !== 'edit') { state.view = 'open'; state.search = ''; }
                    if (!await reload()) showError('Saved, but the page could not refresh. Use Refresh to see your changes.');
                } catch (e) {
                    const field = form.querySelector('[data-error="_form"]');
                    field.textContent = 'Could not confirm the save. Retry, or close and refresh to check your tasks.'; field.hidden = false;
                } finally {
                    saving = false; dialog.removeAttribute('aria-busy'); buttons.forEach(button => button.disabled = false);
                    form.querySelector('[type="submit"]').textContent = 'Save';
                }
            });
            document.body.classList.add('tasks-editor-open'); dialog.showModal();
            form.querySelector('input:not([type="hidden"])')?.focus();
        } catch (e) { showError(e.name === 'AbortError' ? 'Loading took too long. Try again.' : e.message); }
        finally { setBusy(false); }
    }
    async function mutate(fields, rollback = () => {}) {
        setBusy(true); error.hidden = true;
        try {
            const result = await save(fields);
            if (!result.Ok) throw new Error(result.Errors?._form || 'Unable to save. Refresh and try again.');
            if (!await reload()) showError('Saved, but the page could not refresh. Use Refresh to see your changes.');
        } catch (e) { rollback(); showError(e.message); }
        finally { setBusy(false); }
    }
    root.addEventListener('click', async event => {
        if (busy) return;
        const filter = event.target.closest('[data-task-filter]');
        if (filter) { state.filter = filter.dataset.taskFilter; state.list = filter.dataset.listId || ''; updateView(); return; }
        const view = event.target.closest('[data-view]');
        if (view) { state.view = view.dataset.view; updateView(); return; }
        const button = event.target.closest('[data-task-action]');
        if (!button) return;
        const mode = button.dataset.taskAction, kind = button.dataset.kind;
        if (mode === 'refresh') { await reload(); return; }
        if (['create','edit','duplicate'].includes(mode)) { await openEditor(mode,kind,button.dataset.key,button); return; }
        if (mode === 'delete' && !confirm(kind === 'list' ? 'Remove this list? Its tasks will stay available. You can restore the list later.' : 'Remove this task? You can restore it from Removed.')) return;
        await mutate(new URLSearchParams({ kind, mode, key:button.dataset.key, version:button.dataset.version }));
    });
    root.addEventListener('change', async event => {
        if (!event.target.matches('[data-task-complete]') || busy) return;
        const checkbox = event.target, row = checkbox.closest('.task-item');
        const wasCompleted = row.dataset.completed === 'true';
        await mutate(new URLSearchParams({ kind:'task', mode:'complete', key:row.dataset.key, version:row.dataset.version, completed:String(checkbox.checked) }), () => checkbox.checked = wasCompleted);
    });
    search.value = state.search; sort.value = state.sort;
    const listPanel = root.querySelector('.tasks-list-panel');
    if (window.matchMedia('(max-width:600px)').matches) listPanel.open = state.filter === 'list';
    search.addEventListener('input', () => { state.search = search.value; updateView(); });
    sort.addEventListener('change', () => { state.sort = sort.value; updateView(); });
    updateView();
    if (root.dataset.autoDate === 'true' && root.dataset.date !== now().slice(0,10)) { reload(root.dataset.openEditor); return; }
    if (root.dataset.openEditor) openEditor('create',root.dataset.openEditor,'',root.querySelector('[data-task-action="create"]'));
};
