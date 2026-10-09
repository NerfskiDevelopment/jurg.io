window.initAdminDashboard = function () {
    const root = document.querySelector('.control-center-page');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = 'true';
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-admin-nav]');
        if (button) nav(button.dataset.adminNav);
    });
};
