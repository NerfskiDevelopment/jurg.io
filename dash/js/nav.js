var localStorage = window.localStorage;

function redirect(location){
    window.location.replace("./" + location);
}

function redirect_new(location){
    window.open("./" + location, '_blank').focus();
}

function tab_new(location){
    window.open(location, '_blank').focus();
}

function nav_button(location){
    redirect(location);
}

function setup_nav_header(){
    var username = localStorage.getItem("username");
    document.getElementById("nav-login-header").innerHTML = '<button class="nav-button nav-logout" onclick="nav_logout();">Logout</button><image class="nav-login-logo" src="./images/user.png"></image><h3 class="nav-username">' + username + '</h3>';
}

function nav_logout(){
    logout();
}

function clicked_avatar(){
    
}


window.addEventListener("load", (event) => {
    //setup_nav_header();
});