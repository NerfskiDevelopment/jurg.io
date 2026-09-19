const URI_PROD = "https://api.jurg.io/";
const URI_DEBUG = "http://localhost";

function httpGet(theUrl, callback = null)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(getServerURL() + theUrl), true ); // false for synchronous request

    xmlHttp.onload = function(){
        if(callback != null){
            callback(xmlHttp.responseText)
        }
    }

    xmlHttp.onerror = function() {
        if(callback != null){
            callback(new Error("Network connection failed."), null);
        }
    };

    // 3. Optional: Handles request timeouts
    xmlHttp.ontimeout = function() {
        if(callback != null){
            callback(new Error("The request timed out."), null);
        }
    };

    try {
        xmlHttp.send( null );
    }
    catch(error) {
        // This only catches instant execution errors (e.g., malformed URL syntax)
        console.log("Immediate send error:", error);
        if(callback != null) callback(error, null);
    }
    //return xmlHttp.responseText;
} 
function httpGetWithAuth(theUrl, bearer, callback = null)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(getServerURL() + theUrl), true ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);

    xmlHttp.onload = function(){
        if(callback != null){
            callback(xmlHttp.responseText)
        }
    }

    xmlHttp.onerror = function() {
        if(callback != null){
            callback(new Error("Network connection failed."), null);
        }
    };

    // 3. Optional: Handles request timeouts
    xmlHttp.ontimeout = function() {
        if(callback != null){
            callback(new Error("The request timed out."), null);
        }
    };

    try {
        xmlHttp.send( null );
    }
    catch(error) {
        // This only catches instant execution errors (e.g., malformed URL syntax)
        console.log("Immediate send error:", error);
        if(callback != null) callback(error, null);
    }
    //return xmlHttp.responseText;
}
function httpPost(theUrl, params = '', callback = null)
{

    
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", encodeURI(getServerURL() + theUrl), true ); // false for synchronous request
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xmlHttp.onload = function(){
        if(callback != null){
        callback(xmlHttp.responseText)
        }
    }

    xmlHttp.onerror = function() {
        if(callback != null){
            callback(new Error("Network connection failed."), null);
        }
    };

    // 3. Optional: Handles request timeouts
    xmlHttp.ontimeout = function() {
        if(callback != null){
            callback(new Error("The request timed out."), null);
        }
    };

    try {
        xmlHttp.send( encodeURI(params) );
    }
    catch(error) {
        // This only catches instant execution errors (e.g., malformed URL syntax)
        console.log("Immediate send error:", error);
        if(callback != null) callback(error, null);
    }
    //return xmlHttp.responseText;
}
function httpPostWithAuth(theUrl, bearer, params = '', callback = null)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", encodeURI(getServerURL() + theUrl), true ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xmlHttp.onload = function(){
        if(callback != null){
        callback(xmlHttp.responseText)
        }
    }

    xmlHttp.onerror = function() {
        if(callback != null){
            callback(new Error("Network connection failed."), null);
        }
    };

    // 3. Optional: Handles request timeouts
    xmlHttp.ontimeout = function() {
        if(callback != null){
            callback(new Error("The request timed out."), null);
        }
    };

    try {
        xmlHttp.send( encodeURI(params) );
    }
    catch(error) {
        // This only catches instant execution errors (e.g., malformed URL syntax)
        console.log("Immediate send error:", error);
        if(callback != null) callback(error, null);
    }
    //return xmlHttp.responseText;
}

function openWindowWithPost(theUrl, data) {
    var form = document.createElement("form");
    form.target = "_blank";
    form.method = "POST";
    form.action = encodeURI(getServerURL() + theUrl);
    form.style.display = "none";

    for (var key in data) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

function getServerURL(){
    const queryString = window.location.search;

    // 2. Initialize URLSearchParams
    const urlParams = new URLSearchParams(queryString);

    // 3. Extract individual parameters
    const debug_mode = urlParams.get('debug_mode');


    if(debug_mode != null){
        return URI_DEBUG;
    }
    else{
        return URI_PROD;
    }
}