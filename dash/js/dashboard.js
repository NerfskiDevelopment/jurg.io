
/* =========================================================
   LEGACY GLOBAL STATE
========================================================= */

var __document_html_cache = "";
var __last_ReqAction_src = "";
var __lastReqData_src = "";


/* =========================================================
   INTERNAL CONFIGURATION
========================================================= */

var __NAV_MAIN_CONTAINER_ID =
    "main-http-request--json-html-response";

var __NAV_ENDPOINT_PREFIX =
    "/V1/website/html/";

var __NAV_LOAD_DELAY_MS = 25;


/* =========================================================
   OPTIONAL PAGE INITIALIZER REGISTRY
========================================================= */

var __navPageInitializers = {};


function registerPageInitializer(
    action,
    callback) {
    if (
        !action ||
        typeof callback !== "function"
    ) {
        return;
    }
    __navPageInitializers[
        String(action).toLowerCase()
    ] = callback;
}


/* =========================================================
   INTERNAL HELPERS
========================================================= */

function __navGetContainer() {
    return document.getElementById(
        __NAV_MAIN_CONTAINER_ID
    );
}
function __navGetToken() {
    return localStorage.getItem(
        "token"
    );
}

function __navGetUrl(action) {
    return (
        __NAV_ENDPOINT_PREFIX +
        action
    );
}

function __navSafeHideTemp() {
    if (
        typeof hideTemp === "function"
    ) {
        hideTemp();
    }
}

function __navRunPageInitializer(action) {
    var actionLower =
        String(action || "")
            .toLowerCase();
    try {
        /*
         * Preserve the two initializers
         * that existed in the original file.
         */
        if (
            actionLower ===
                "dashboard_itmanagefiles.html" &&
            typeof initQuillEditor ===
                "function"
        ) {
            initQuillEditor();
        }
        if (
            actionLower ===
                "calendarevents.html" &&
            typeof initVacationCalendar ===
                "function"
        ) {

            initVacationCalendar();
        }

        var customInitializer =
            __navPageInitializers[
                actionLower
            ];
        if (
            typeof customInitializer ===
            "function"
        ) {
            customInitializer();
        }
    }
    catch (error) {
        console.error(
            "Page initializer failed for:",
            action,
            error
        );
    }
}

/*
 * The original code treated any response
 * beginning with "{" as a JSON/error response.
 */
function __navHandleErrorResponse(
    response
) {
    if (
        typeof response !==
        "string"
    ) {
        return false;
    }
    var trimmed =
        response.trimStart();

    if (
        !trimmed.startsWith("{")
    ) {
        return false;
    }

    throwErr(trimmed);

    return true;
}

function __navRequestGet(action) {
    return httpGetWithAuth(
        __navGetUrl(action),
        __navGetToken()
    );
}

function __navRequestPost(
    action,
    data
) {
    return httpPostWithAuth(
        __navGetUrl(action),
        __navGetToken(),
        data
    );
}


function __navRenderResponse(
    response
) {
    var container =
        __navGetContainer();

    if (!container) {
        console.error(
            "Navigation container not found: #" +
            __NAV_MAIN_CONTAINER_ID
        );
        return false;
    }


    container.innerHTML =
        response;


    __document_html_cache =
        response;


    return true;

}


/*
 * Used by nav_c()
 */
function __navSetMainActive(
    action
) {
    var activeElement =
        document.getElementById(
            action
        );

    if (!activeElement) {
        return;
    }

    var docs =
        document.getElementsByClassName(
            "nav-item"
        );

    for (
        var i = 0;
        i < docs.length;
        i++
    ) {
        docs[i].classList.remove(
            "active"
        );
    }
    activeElement.classList.add(
        "active"
    );
}


/*
 * Used by POST-style navigation.
 */
function __navSetNamedActive(
    action,
    preserveDisabled
) {
    var activeElement =
        document.getElementById(
            action
        );

    if (!activeElement) {
        return;
    }

    var docs =
        document.getElementsByName(
            "nav-btn"
        );
    for (
        var i = 0;
        i < docs.length;
        i++
    ) {
        var isDisabled =
            docs[i].classList.contains(
                "disabled"
            );
        docs[i].classList.remove(
            "nav-link-active"
        );
        if (
            !preserveDisabled &&
            !isDisabled
        ) {}
    }

    activeElement.classList.add(
        "nav-link-active"
    );
}


/*
 * Shared GET/POST page renderer.
 */
function __navNavigate(
    action,
    options
) {

    options =
        options || {};


    var method =
        options.method ||
        "GET";


    var data =
        options.data;


    var navMode =
        options.navMode ||
        null;


    var preserveDisabled =
        options.preserveDisabled !==
        false;


    var runInitializer =
        options.runInitializer ===
        true;


    var animate =
        options.animate ===
        true;


    var hideTemporary =
        options.hideTemporary ===
        true;


    var response;


    try {

        if (
            String(method)
                .toUpperCase() ===
            "POST"
        ) {

            response =
                __navRequestPost(
                    action,
                    data
                );

        }
        else {

            response =
                __navRequestGet(
                    action
                );

        }

    }
    catch (error) {

        console.error(
            "Navigation request failed:",
            action,
            error
        );


        return null;

    }


    if (
        __navHandleErrorResponse(
            response
        )
    ) {

        return null;

    }


    if (
        !__navRenderResponse(
            response
        )
    ) {

        return null;

    }


    if (
        navMode === "main"
    ) {

        __navSetMainActive(
            action
        );

    }
    else if (
        navMode === "named"
    ) {

        __navSetNamedActive(
            action,
            preserveDisabled
        );

    }


    if (
        runInitializer
    ) {

        __navRunPageInitializer(
            action
        );

    }


    if (
        hideTemporary
    ) {

        __navSafeHideTemp();

    }


    if (
        animate
    ) {

        playAnim();

    }


    return response;

}


/* =========================================================
   ORIGINAL PUBLIC FUNCTIONS
========================================================= */


/*
 * GET a server-rendered page
 * and place it in the main page.
 */
function nav_c(action) {

    var response =
        __navNavigate(
            action,
            {
                method: "GET",

                navMode: "main",

                runInitializer: true,

                animate: true,

                hideTemporary: false
            }
        );


    if (
        response === null
    ) {
        return;
    }


    /*
     * Preserve original behavior:
     * normal navigation clears
     * search/rerun state.
     */

    __last_ReqAction_src =
        "";

    __lastReqData_src =
        "";

}


/*
 * POST data to a server-rendered page.
 */
function nav_cd(
    action,
    data
) {

    __navNavigate(
        action,
        {
            method: "POST",

            data: data,

            navMode: "named",

            preserveDisabled: true,

            hideTemporary: true
        }
    );

}


/*
 * Read one field and POST it.
 */
function nav_src(
    actionId,
    action
) {

    var element =
        document.getElementById(
            actionId
        );


    if (!element) {

        console.error(
            "nav_src could not find element:",
            actionId
        );

        return;

    }


    /*
     * Keep exact legacy body format.
     */

    var data =
        actionId +
        "=" +
        element.value;


    var response =
        __navNavigate(
            action,
            {
                method: "POST",

                data: data,

                navMode: "named",

                preserveDisabled: true,

                hideTemporary: true
            }
        );


    if (
        response === null
    ) {
        return;
    }


    __last_ReqAction_src =
        action;


    __lastReqData_src =
        data;

}


/*
 * Re-run the last nav_src request.
 *
 * Existing calls with an action still work.
 * Calling nav_rer() with no argument also works.
 */
function nav_rer(action) {

    var rerunAction =
        action ||
        __last_ReqAction_src;


    if (
        !rerunAction
    ) {
        return;
    }


    __navNavigate(
        rerunAction,
        {
            method: "POST",

            data:
                __lastReqData_src,

            navMode: "named",

            preserveDisabled: true,

            hideTemporary: true
        }
    );

}


/*
 * Gather multiple fields
 * and POST them.
 */
function nav_sbmt(
    action,
    actionIds
) {

    var data = "";


    for (
        var i = 0;
        i < actionIds.length;
        i++
    ) {

        var element =
            document.getElementById(
                actionIds[i]
            );


        if (!element) {

            console.warn(
                "nav_sbmt could not find element:",
                actionIds[i]
            );

            continue;

        }


        var value =
            element.value;


        /*
         * Preserve legacy behavior.
         */
        if (
            typeof value ===
                "string" &&
            value.includes("&")
        ) {

            value =
                value.replaceAll(
                    "&",
                    ""
                );

        }


        if (
            data === ""
        ) {

            data =
                actionIds[i] +
                "=" +
                value;

        }
        else {

            data +=
                "&" +
                actionIds[i] +
                "=" +
                value;

        }

    }


    console.log(data);


    var response;


    try {

        response =
            __navRequestPost(
                action,
                data
            );

    }
    catch (error) {

        console.error(
            "Navigation submit failed:",
            action,
            error
        );


        return;

    }


    if (
        __navHandleErrorResponse(
            response
        )
    ) {

        return;

    }


    /*
     * Preserve original behavior:
     * submit action, then return
     * to last nav_src page.
     */
    if (
        __last_ReqAction_src !==
        ""
    ) {

        nav_rer(
            __last_ReqAction_src
        );

        return;

    }


    if (
        !__navRenderResponse(
            response
        )
    ) {

        return;

    }


    __navSetNamedActive(
        action,
        true
    );


    __navSafeHideTemp();


    playAnim();

}


/*
 * Gather checked checkboxes
 * and open result via POST window.
 */
function nav_gther(
    action,
    id
) {

    var cookie =
        __navGetToken();


    var checkboxes =
        document.getElementsByName(
            id
        );


    var checkboxesChecked =
        [];


    var checkboxesCheckedStr =
        "";


    for (
        var i = 0;
        i < checkboxes.length;
        i++
    ) {

        if (
            checkboxes[i].checked
        ) {

            checkboxesChecked.push(
                checkboxes[i]
            );


            if (
                checkboxesCheckedStr ===
                ""
            ) {

                checkboxesCheckedStr =
                    checkboxes[i].value;

            }
            else {

                checkboxesCheckedStr +=
                    "," +
                    checkboxes[i].value;

            }

        }

    }


    openWindowWithPost(
        "/" + action,
        {
            data:
                checkboxesCheckedStr,

            token:
                cookie
        }
    );


    __navSafeHideTemp();

}


/*
 * CSV/download helper.
 */
function nav_csv_submit(
    action,
    from,
    to
) {

    var fromElement =
        document.getElementById(
            from
        );


    var toElement =
        document.getElementById(
            to
        );


    if (
        !fromElement ||
        !toElement
    ) {

        console.error(
            "nav_csv_submit is missing one or more fields."
        );

        return;

    }


    openWindowWithPost(
        "/" + action,
        {
            token:
                __navGetToken(),

            from:
                fromElement.value,

            to:
                toElement.value
        }
    );

}


/*
 * CSV/download helper with product.
 */
function nav_csv_submit2(
    action,
    from,
    to,
    product
) {

    var fromElement =
        document.getElementById(
            from
        );


    var toElement =
        document.getElementById(
            to
        );


    var productElement =
        document.getElementById(
            product
        );


    if (
        !fromElement ||
        !toElement ||
        !productElement
    ) {

        console.error(
            "nav_csv_submit2 is missing one or more fields."
        );

        return;

    }


    openWindowWithPost(
        "/" + action,
        {
            token:
                __navGetToken(),

            from:
                fromElement.value,

            to:
                toElement.value,

            product:
                productElement.value
        }
    );

}


/*
 * Open external/alternate page
 * with one data value.
 */
function nav_red(
    action,
    id
) {

    openWindowWithPost(
        action,
        {
            data:
                id,

            token:
                __navGetToken()
        }
    );


    __navSafeHideTemp();

}

function overlayLoad(action, data) {

    var response;

    try {

        if (data === undefined || data === null) {

            response = __navRequestGet(action);

        } else {

            response = __navRequestPost(
                action,
                data
            );

        }

    }
    catch (error) {

        console.error(
            "Overlay request failed:",
            action,
            error
        );

        return;

    }


    if (
        __navHandleErrorResponse(
            response
        )
    ) {
        return;
    }


    var root =
        document.getElementById(
            "page-overlay-root"
        );


    if (!root) {

        console.error(
            "Overlay root not found: #page-overlay-root"
        );

        return;

    }


    root.innerHTML = `
    <div class="page-overlay">

        <div
            class="page-overlay-backdrop"
            onclick="closePageOverlay()"
        ></div>

        <div class="page-overlay-content">

            <div class="page-overlay-body">
                ${response}
            </div>

        </div>

        </div>`;


    document.body.classList.add(
        "overlay-open"
    );

}


function closePageOverlay() {

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

}


/*
 * Open external/alternate page
 * with only auth token.
 */
function nav_red2(action) {

    openWindowWithPost(
        action,
        {
            token:
                __navGetToken()
        }
    );


    __navSafeHideTemp();

}


/*
 * Show loader then POST page.
 */
function nav_load(
    action,
    data
) {

    var container =
        __navGetContainer();

    if (!container) {
        console.error(
            "Navigation container not found: #" +
            __NAV_MAIN_CONTAINER_ID
        );
        return;
    }
    container.innerHTML =
        '<center>' +
            '<h3>' +
                'This may take a few seconds... please do not exit this page' +
            '</h3>' +
            '<br><br><br>' +
            '<div class="loader32"></div>' +
        '</center>';


    setTimeout(

        function () {

            __navNavigate(
                action,
                {
                    method: "POST",

                    data: data,

                    navMode: "named",

                    preserveDisabled:
                        false
                }
            );
        },
        __NAV_LOAD_DELAY_MS
    );
}

/*
 * Search cached page HTML.
 */
function searchPage() {

    var searchInput =
        document.getElementById(
            "top-search"
        );


    var container =
        __navGetContainer();


    if (
        !searchInput ||
        !container
    ) {
        return;
    }


    var value =
        searchInput.value;


    var searchDocument =
        __document_html_cache;


    if (
        value.length <= 1
    ) {

        container.innerHTML =
            __document_html_cache;


        return;

    }


    if (
        searchDocument
            .toUpperCase()
            .includes(
                value.toUpperCase()
            )
    ) {

        var newDocument =
            searchDocument.replaceAll(
                value,
                "<span class='highlighted' id='unique-id-scroll-here'>" +
                    value +
                "</span>"
            );


        container.innerHTML =
            newDocument;


        var match =
            document.getElementById(
                "unique-id-scroll-here"
            );


        if (match) {

            match.scrollIntoView({
                block: "center"
            });

        }

    }

}


/*
 * Display JSON error message.
 */
function throwErr(msg) {

    try {

        var parsed =
            typeof msg === "string"
                ? JSON.parse(msg)
                : msg;


        if (
            parsed &&
            parsed.message !==
                undefined
        ) {

            alert(
                parsed.message
            );

        }

    }
    catch (error) {

        console.error(
            "Unable to parse server error:",
            msg,
            error
        );

    }

}


/*
 * Existing page transition animation.
 */
function playAnim() {

    var container =
        __navGetContainer();


    if (!container) {
        return;
    }


    container.classList.add(
        "main-http-request--json-html-response-active"
    );


    setTimeout(

        function () {

            var currentContainer =
                __navGetContainer();


            if (
                currentContainer
            ) {

                currentContainer
                    .classList
                    .remove(
                        "main-http-request--json-html-response-active"
                    );

            }

        },

        500

    );

}


/* =========================================================
   STARTUP
========================================================= */

window.addEventListener(
    "load",
    function () {

        if (
            typeof loadLoginCookie ===
            "function"
        ) {

            loadLoginCookie();

        }


        nav_c(
            "DASHBOARD_HOME.HTML"
        );


        /*
         * Preserve original permission read.
         */

        var permissions =
            localStorage.getItem(
                "permissions"
            );


        void permissions;

    }
);