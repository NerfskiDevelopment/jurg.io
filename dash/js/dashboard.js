var __document_html_cache = "";
var __last_ReqAction_src = "";
var __lastReqData_src = "";

function nav_c(action){
    var cookie = localStorage.getItem("token");
    var response = (httpGetWithAuth("/V1/website/html/" + action, cookie));

    if(response.startsWith("{")){
        throwErr(response);
        return;
    }

    document.getElementById('main-http-request--json-html-response').innerHTML = response;
    //console.log(response);
    __document_html_cache = response;
    __last_ReqAction_src = '';
    __lastReqData_src = '';

    if(action == "dashboard_itmanagefiles.html"){
        initQuillEditor();
    }
    if(action == "calendarevents.html"){
        initVacationCalendar();
    }


    //dealing with buttons
    if(document.getElementById(action) != undefined){
        var docs = document.getElementsByClassName('nav-item');
        for(var i = 0 ; i < docs.length; i ++){
            docs[i].classList = "nav-item";
        }
        document.getElementById(action).classList = "nav-item active";
    }

    playAnim();
}

function nav_cd(action, data){
    var cookie = localStorage.getItem("token");
    var response = (httpPostWithAuth("/V1/website/html/" + action, cookie, data));

    if(response.startsWith("{")){
        throwErr(response);
        return;
    }


    document.getElementById('main-http-request--json-html-response').innerHTML = response;
    //console.log(response);
    __document_html_cache = response;
    
    //dealing with buttons
    if(document.getElementById(action) != undefined){
        var docs = document.getElementsByName('nav-btn');
        for(var i = 0 ; i < docs.length; i ++){
            if(docs[i].classList.includes("disabled")){
                docs[i].classList = "disabled";
            }
            else{
                docs[i].classList = "";
            }
            
        }
        document.getElementById(action).classList = "nav-link-active";
    }

    hideTemp();
}

function nav_src(actionId, action){
    var value = document.getElementById(actionId).value;
    var data = actionId + "=" + value;

    var cookie = localStorage.getItem("token");
    var response = (httpPostWithAuth("/V1/website/html/" + action, cookie, data));

    if(response.startsWith("{")){
        throwErr(response);
        return;
    }


    document.getElementById('main-http-request--json-html-response').innerHTML = response;
    //console.log(response);
    __document_html_cache = response;
    __last_ReqAction_src = action;
    __lastReqData_src = data;
    
    //dealing with buttons
    if(document.getElementById(action) != undefined){
        var docs = document.getElementsByName('nav-btn');
        for(var i = 0 ; i < docs.length; i ++){
            if(docs[i].classList.includes("disabled")){
                docs[i].classList = "disabled";
            }
            else{
                docs[i].classList = "";
            }
            
        }
        document.getElementById(action).classList = "nav-link-active";
    }

    hideTemp();
}
//reruns the src function for page navigation
function nav_rer(action){
    var data = __lastReqData_src;

    var cookie = localStorage.getItem("token");
    var response = (httpPostWithAuth("/V1/website/html/" + action, cookie, data));

    if(response.startsWith("{")){
        throwErr(response);
        return;
    }


    document.getElementById('main-http-request--json-html-response').innerHTML = response;
    //console.log(response);
    __document_html_cache = response;
    
    //dealing with buttons
    if(document.getElementById(action) != undefined){
        var docs = document.getElementsByName('nav-btn');
        for(var i = 0 ; i < docs.length; i ++){
            if(docs[i].classList.includes("disabled")){
                docs[i].classList = "disabled";
            }
            else{
                docs[i].classList = "";
            }
            
        }
        document.getElementById(action).classList = "nav-link-active";
    }

    hideTemp();
}

function nav_sbmt(action, actionIds){
    var data = "";
    for(var i = 0; i < actionIds.length; i++){
        var value = document.getElementById(actionIds[i]).value;
        
        if(value.includes("&")){
            value = value.replaceAll("&", "");
        }

        //appending data
        if(data == ""){
            data = actionIds[i] + "=" + value;
        }
        else{
            data = data + "&" + actionIds[i] + "=" + value;
        }
    }
    console.log(data);

    var cookie = localStorage.getItem("token");
    var response = (httpPostWithAuth("/V1/website/html/" + action, cookie, data));

    if(response.startsWith("{")){
        throwErr(response);
        return;
    }

    if(__last_ReqAction_src != ''){
        nav_rer(__last_ReqAction_src);
        return;
    }
    
    document.getElementById('main-http-request--json-html-response').innerHTML = response;
    //console.log(response);
    __document_html_cache = response;
    
    //dealing with buttons
    if(document.getElementById(action) != undefined){
        var docs = document.getElementsByName('nav-btn');
        for(var i = 0 ; i < docs.length; i ++){
            if(docs[i].classList.includes("disabled")){
                docs[i].classList = "disabled";
            }
            else{
                docs[i].classList = "";
            }
            
        }
        document.getElementById(action).classList = "nav-link-active";
    }
    hideTemp();

    playAnim();
}

function nav_gther(action, id){
    var cookie = localStorage.getItem("token");

    var checkboxes = document.getElementsByName(id);
    var checkboxesChecked = [];
    var checkboxesCheckedStr = '';
    // loop over them all
    for (var i=0; i<checkboxes.length; i++) {
       // And stick the checked ones onto an array...
       if (checkboxes[i].checked) {
          checkboxesChecked.push(checkboxes[i]);

          if(checkboxesCheckedStr == ''){
            checkboxesCheckedStr = checkboxes[i].value;
          }
          else{
            checkboxesCheckedStr += ',' + checkboxes[i].value;
          }
       }
    }

    //nav_cd(action, 'data=' + checkboxesCheckedStr);

    openWindowWithPost("/" + action, {data: checkboxesCheckedStr, token: cookie });

    hideTemp();
}

function nav_csv_submit(action, from, to){
    var from1 = document.getElementById(from).value;
    var to1 = document.getElementById(to).value;
    
    var cookie = localStorage.getItem("token");
    
    openWindowWithPost("/" + action, {token: cookie, from: from1, to: to1 });
}
function nav_csv_submit2(action, from, to, product){
    var from1 = document.getElementById(from).value;
    var to1 = document.getElementById(to).value;
    var product1 = document.getElementById(product).value;
    
    var cookie = localStorage.getItem("token");
    
    openWindowWithPost("/" + action, {token: cookie, from: from1, to: to1, product: product1 });
}

function nav_red(action, id){
    var cookie = localStorage.getItem("token");
    //print/documents/weborder
    openWindowWithPost(action, {data: id, token: cookie });

    hideTemp();
}
function nav_red2(action){
    var cookie = localStorage.getItem("token");
    //print/documents/weborder
    openWindowWithPost(action, { token: cookie });

    hideTemp();
}

function nav_load(action, data){
    document.getElementById("main-http-request--json-html-response").innerHTML = '<center><h3>This may take a few seconds... please do not exit this page</h3><br><br><br><div class="loader32"></div></center>';

    setTimeout(() =>{
        var cookie = localStorage.getItem("token");
        var response = (httpPostWithAuth("/V1/website/html/" + action, cookie, data));

        if(response.startsWith("{")){
            throwErr(response);
            return;
        }

        document.getElementById('main-http-request--json-html-response').innerHTML = response;
        //console.log(response);
        __document_html_cache = response;
        
        //dealing with buttons
        if(document.getElementById(action) != undefined){
            var docs = document.getElementsByName('nav-btn');
            for(var i = 0 ; i < docs.length; i ++){
                docs[i].classList = "";
            }
            document.getElementById(action).classList = "nav-link-active";
        }
    }, "1000");
}

// will openWindowWithPost('/V1/downloads/csv/Shipping_Orders.csv', {data: checkboxesCheckedStr, token: cookie });search the page and scroll to the caret.
function searchPage(){
    var value = document.getElementById("top-search").value;
    var searchDocument = __document_html_cache;

    if(value.length <= 1){
        document.getElementById("main-http-request--json-html-response").innerHTML = __document_html_cache
        return;
    }

    //contains value
    if(searchDocument.toUpperCase().includes(value.toUpperCase())){
        var newDocument = searchDocument.replaceAll(value, "<span class='highlighted' id='unique-id-scroll-here'>" + value + "</span>");

        document.getElementById("main-http-request--json-html-response").innerHTML = newDocument;
        document.getElementById("unique-id-scroll-here").scrollIntoView();
    }
}

function throwErr(msg){
    if(JSON.parse(msg)['message'] != undefined){
        alert(JSON.parse(msg)['message']);
    }
}

function playAnim(){
    document.getElementById("main-http-request--json-html-response").classList.add("main-http-request--json-html-response-active");
    setTimeout(() => {
        document.getElementById("main-http-request--json-html-response").classList.remove("main-http-request--json-html-response-active");
    }, 500);
}


window.addEventListener("load", (event) => {
    loadLoginCookie();
    

    nav_c('DASHBOARD_HOME.HTML');

    //checking if we can even view the workflow dashboard
    // -> if not we don't show certain things.
    var permissions = localStorage.getItem("permissions");
});
