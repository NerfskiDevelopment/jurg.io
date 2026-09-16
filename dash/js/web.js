//const URI = "http://localhost";
const URI = "https://api.jurg.io/";

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(URI + theUrl), false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function httpGetWithAuth(theUrl, bearer)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(URI + theUrl), false ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function httpPost(theUrl, params = '')
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", encodeURI(URI + theUrl), false ); // false for synchronous request
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlHttp.send( encodeURI(params) );
    return xmlHttp.responseText;
}
function httpPostWithAuth(theUrl, bearer, params = '')
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", encodeURI(URI + theUrl), false ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlHttp.send( encodeURI(params) );
    return xmlHttp.responseText;
}

function openWindowWithPost(theUrl, data) {
    var form = document.createElement("form");
    form.target = "_blank";
    form.method = "POST";
    form.action = encodeURI(URI + theUrl);
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
