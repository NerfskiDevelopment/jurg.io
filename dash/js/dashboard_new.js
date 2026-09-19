var __document_html_cache = "";
var __last_ReqAction_src = "";
var __lastReqData_src = "";


/* ============================================================
   ============================================================ */

/* -------------------------
   Global State
------------------------- */
let PAGE_CACHE_HTML = '';
let LAST_SEARCH_ACTION = '';
let LAST_SEARCH_DATA = '';
var REQUEST_FINISHED = false;
var CLOSE_WINDOW_AFTER_CALL = false;
var INIT_CALL = false;
var IN_NEW_WINDOW = false;
var PRE_WINDOW_LOCATION = '';

/* -------------------------
   DOM Helpers
------------------------- */
const dom = {
    content: () => document.getElementById('main-http-request--json-html-response'),
    navButtons: () => document.getElementsByName('nav-btn'),
    token: () => localStorage.getItem('token'),
    permissions: () => Number(localStorage.getItem('permissions') || 0)
};

/* -------------------------
   Core Render Pipeline
------------------------- */
function renderHTML(html) {
    dom.content().innerHTML = html;
    PAGE_CACHE_HTML = html;

    //document.getElementById("scroll-section").scrollTop = 0;
    window.scrollTo(0, 0);

    applyPermissions();
    setTimeout(runPageInitHooks, 0);
    playPageAnimation();

    if(CLOSE_WINDOW_AFTER_CALL && INIT_CALL == false){
        CLOSE_WINDOW_AFTER_CALL = false;
        window.close()
    }
    else if (INIT_CALL == true){
        INIT_CALL = false;
    }


    // Wait for browser to render the inserted content
    //scrolling to top if there is a console div
    if (html.includes('id="console"')) {
        requestAnimationFrame(() => {
            const consoleElement = dom.content().querySelector("#console");

            consoleElement.scrollTop = consoleElement.scrollHeight;
        });
    }
}

function showLoader(message = 'This may take a few seconds...') {
    dom.content().innerHTML = `
        <center>
            <br>
            <br>
            <h5>${message}</h5>
            <br>
            <br>
            <div class="loader34"></div>
        </center>
    `;

    playPageAnimation();
}

/* -------------------------
   Network Layer
------------------------- */
function requestHTML({ url, method = 'GET', data = null }, callback = null) {
    const token = dom.token();
    let response;
    REQUEST_FINISHED = false;

    if (method === 'POST') {
        httpPostWithAuth(url, token, data, function(data){

            //calling back
            if(callback != null){
                REQUEST_FINISHED = true;
                callback(data);
            }
        });
    } else {
        httpGetWithAuth(url, token, function(data){

            //calling back
            if(callback != null){
                REQUEST_FINISHED = true;
                callback(data);
            }
        });
    }

    //if (response.startsWith('{')) {
    //    throwServerError(response);
    //    return null;
   // }

    //return response;
}

/* -------------------------
   Navigation State
------------------------- */
function updateActiveNav(action) {
    const active = document.getElementById(action);
    if (!active) return;

    for (const btn of dom.navButtons()) {
        btn.classList.toggle(
            'disabled',
            btn.classList.contains('disabled')
        );
        btn.classList.remove('nav-link-active');
    }

    active.classList.add('nav-link-active');
}

/* -------------------------
   Public Navigation API
------------------------- */

// GET navigation
function nav(action, btn) {
    if(btn != null || action == 'CREATE_DELIVERY.HTML'){
        if(btn == null){
            btn = document.getElementById("create-d-btn");
        }
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    PRE_WINDOW_LOCATION = `/V1/website/html/${action}`;


    //getting html 
    requestHTML({
        url: `/V1/website/html/${action}`,
        method: 'GET'
    }, function(html){
        if (!html) return;
        renderHTML(html);
        updateActiveNav(action);
    });
}

function navGetLoad(action, btn){
    const loaderTimeout = setTimeout(() =>{
        if(!REQUEST_FINISHED){
            showLoader();
        }
    }, 200);

    nav(action, btn);
}

// POST navigation
function navPost(action, data) {

    if(action == 'CREATE_DELIVERY.HTML'){
        var btn = document.getElementById("create-d-btn");
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    PRE_WINDOW_LOCATION = action;
    LAST_SEARCH_DATA = data; 

    requestHTML({
        url: `/V1/website/html/${action}`,
        method: 'POST',
        data
    }, function(html){
        if (!html) return;

        renderHTML(html);
        updateActiveNav(action);
    });
}

//pushes data asynchronously
function asyncPushData(action, data, callback){
    const token = dom.token();

    httpPostWithAuth(`/V1/website/html/${action}`, token, data, function(data){
        callback();
    });
}

// POST navigation
function navPostPopup(action, data, close = true, width= 600, height=500, refreshWindowAfterClose = true) {
    var postData = btoa(data);
    var window_data = btoa('loc=' + action + "&data=" + postData + "&c=" + close);
    var ext = '';

    if(getDebugMode()){
        ext = '&debug_mode=true'
    }

    const newWindow = window.open('./window.html?q=' + window_data + ext, '_blank', 'width=' + width + ',height=' + height + ',top=100,left=100,popup=true');

    //will close the window
    if (newWindow && refreshWindowAfterClose == true) {
        const timer = setInterval(() => {
            if (newWindow.closed) {
                clearInterval(timer);
                // Do something here
                if(PRE_WINDOW_LOCATION.startsWith('/')){
                   navLoad_base(PRE_WINDOW_LOCATION);
                }
                else{
                    navRerun(PRE_WINDOW_LOCATION)
                    //navLoad(PRE_WINDOW_LOCATION);
                }
            }
        }, 100);
    }
}

function navSubmitPopup(action, inputIds=[], close = true, width=1000, height=800, refreshWindowAfterClose = true){
    const data = buildFormData(inputIds);
    navPostPopup(action, data, close, width, height, refreshWindowAfterClose);
}

//overlay navigation
function navOverlay(action, data){
    requestHTML({
        url: `/V1/website/html/${action}`,
        method: 'POST',
        data
    }, function(html){
        if (!html) return;

        root = document.getElementById(
            "page-overlay-root"
        );
        root.innerHTML = `
            <div class="page-overlay fadeIn">
                <div
                    class="page-overlay-backdrop"
                    onclick="closePageOverlay()"
                ></div>
                <div class="page-overlay-content">
                    <div class="page-overlay-body">
                        ${html}
                    </div>
                </div>
                </div>`;
            document.body.classList.add(
                "overlay-open"
            );
    });

    
}
//closes the overlay
function closePageOverlay() {
    var root =
            document.getElementById(
                "page-overlay-root"
            );
            document.getElementsByClassName("page-overlay")[0].classList.remove(
                "fadeIn"
            );
            document.getElementsByClassName("page-overlay")[0].classList.add(
                "fadeOut"
            );

    setTimeout(() => {
        //changes root
        var root =
            document.getElementById(
                "page-overlay-root"
            );
        if (root) {
            root.innerHTML = "";
        }
        document.body.classList.remove(
            "overlay-open"
        );
    }, 500);


    
}


// POST navigation, with confirmation text
function navPostConfirm(action, data, confirmationText){
    if(confirm(confirmationText)){
        navPost(action,data);
    }
}

// Search-based navigation
function navSearch(inputId, action) {
    const value = document.getElementById(inputId)?.value || '';
    const data = `${inputId}=${sanitize(value)}`;

    LAST_SEARCH_ACTION = action;
    LAST_SEARCH_DATA = data;

    navPost(action, data);
}

// Rerun last search
function navRerun(action) {
    if (!LAST_SEARCH_DATA) {
        navLoad(action, null)
        return;
    }
    navPost(action, LAST_SEARCH_DATA);
}

// Submit form fields
function navSubmit(action, inputIds = []) {
    const data = buildFormData(inputIds);

    if (LAST_SEARCH_ACTION) {
        navRerun(LAST_SEARCH_ACTION);
        return;
    }

    navPost(action, data);
}

function navSubmitLoad(action, inputIds = []){
    setTimeout(() =>{
        const data = buildFormData(inputIds);

        if (LAST_SEARCH_ACTION) {
            navRerun(LAST_SEARCH_ACTION);
            return;
        }

        navPost(action, data);

        showLoader();
    });
}

// Delayed load with spinner
function navLoad(action, data) {
    const loaderTimeout = setTimeout(() =>{
        if(!REQUEST_FINISHED){
            showLoader();
        }
    }, 200);

    navPost(action, data);
}

function navLoad_base(action, data){
    const loaderTimeout = setTimeout(() =>{
        if(!REQUEST_FINISHED){
            showLoader();
        }
    }, 200);

    PRE_WINDOW_LOCATION = action;

    requestHTML({
        url: `${action}`,
        method: 'POST',
        data
    }, function(html){
        if (!html) return;

        renderHTML(html);
        updateActiveNav(action);
    });
}

// Delayed load with spinner
function navOrigLoad(action, btn) {
    const loaderTimeout = setTimeout(() =>{
        if(!REQUEST_FINISHED){
            showLoader();
        }
    }, 200);

    navPost(action, data);
}

/* -------------------------
   Window / Export Actions
------------------------- */
function navOpen(action, payload = {}) {
    openWindowWithPost(action, {
        ...payload,
        token: dom.token()
    });
}

function openWindow(url){
    const newWindow = window.open(url, ',top=100,left=100,popup=true');
}

function navGather(action, checkboxName) {
    const values = [...document.getElementsByName(checkboxName)]
        .filter(cb => cb.checked)
        .map(cb => cb.value)
        .join(',');

    navOpen(`/${action}`, { data: values });
}

function navCSV(action, from, to, product = null) {
    const payload = {
        from: document.getElementById(from)?.value,
        to: document.getElementById(to)?.value
    };

    if (product) {
        payload.product = document.getElementById(product)?.value;
    }

    navOpen(`/${action}`, payload);
}

/* -------------------------
   Page Search
------------------------- */
function searchPage() {
    const query = document.getElementById('top-search')?.value || '';

    if (query.length <= 1) {
        dom.content().innerHTML = PAGE_CACHE_HTML;
        return;
    }

    if (!PAGE_CACHE_HTML.toUpperCase().includes(query.toUpperCase())) return;

    const highlighted = PAGE_CACHE_HTML.replaceAll(
        query,
        `<span class="highlighted" id="search-hit">${query}</span>`
    );

    dom.content().innerHTML = highlighted;
    document.getElementById('search-hit')?.scrollIntoView();
}

/* -------------------------
   Permissions & UI
------------------------- */
function applyPermissions() {
    const perms = dom.permissions();

    const disableIds = [
        'DASHBOARD_COMPANY_DIRECTORY.HTML',
        'DASHBOARD_ADMIN_SALES.HTML',
        'DASHBOARD_ADMIN_VAULT.HTML',
        'DASHBOARD_ADMIN_DASHBOARD.HTML',
        'DASHBOARD_SLINGSHOT_ACTIVE.HTML',
        'DASHBOARD_SLINGSHOT_JOF.HTML'
    ];

    disableIds.forEach(id =>
        document.getElementById(id)?.classList.add('disabled')
    );

    if (perms < 5) {
        document
            .getElementById('DASHBOARD_SLINGSHOT_PRESSCHEDULE.HTML')
            ?.classList.add('disabled');
    }
}

/* -------------------------
   Animations & Hooks
------------------------- */
function playPageAnimation() {
    const el = dom.content();
    el.classList.add('fadeIn');

    setTimeout(() => {
        el.classList.remove('fadeIn');
    }, 400);


}

// Runs after every HTML injection
function runPageInitHooks() {
    const container = dom.content().firstElementChild;
    if (!container) return;

    const initFnName = container.dataset.init;
    if (initFnName && typeof window[initFnName] === 'function') {
        window[initFnName]();
    }
}

/* -------------------------
   Utilities
------------------------- */
function buildFormData(ids) {
    return ids
        .map(id => {
            // First, try finding a normal input by ID
            const element = document.getElementById(id);

            if (element) {
                return `${id}=${sanitize(element.value || '')}`;
            }
            // If no ID exists, try finding a checked radio by name
            const radio = document.querySelector(
                `input[type="radio"][name="${CSS.escape(id)}"]:checked`
            );
            if (radio) {
                return `${id}=${sanitize(radio.value || '')}`;
            }
            // Nothing found
            return `${id}=`;
        })
        .join('&');
}

function sanitize(value) {
    return value.replaceAll('&', '');
}

function throwServerError(msg) {
    try {
        const json = JSON.parse(msg);
        //alert(json.ERROR || 'Server error');
        renderHTML('<center><h2>You do not have permission to access this page.</h2></center>');
    } catch {
        alert('Unknown server error');
    }
}

function getDebugMode(){
    const queryString = window.location.search;

    // 2. Initialize URLSearchParams
    const urlParams = new URLSearchParams(queryString);

    // 3. Extract individual parameters
    const debug_mode = urlParams.get('debug_mode');


    if(debug_mode != null){
        return true;
    }
    else{
        return false;
    }
}

window.addEventListener("load", (event) => {
    showLoader();
    loadLoginCookie();

    INIT_CALL = true;

    if(IN_NEW_WINDOW == false){
        console.log("here");
        //nav('DASHBOARD_HOME.HTML');
    }
    nav('DASHBOARD_HOME.HTML');
    //checking if we can even view the workflow dashboard
    // -> if not we don't show certain things.
    var permissions = localStorage.getItem("permissions");
});
