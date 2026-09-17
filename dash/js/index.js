function login_clicked(){
    //getting variables
    var username = document.getElementById("username_field").value;
    var password = document.getElementById("passwordInput").value;

    //getting result
    var result = login(username, password);

    //checking result
    if(result == "CONTINUE"){
        localStorage.setItem("u", username);
        localStorage.setItem("p", password);
        document.getElementById("login-error").innerHTML = "loading...";
        redirect("dashboard.html");
    }
    //throwing error
    else{
        document.getElementById("login-error").innerHTML = result;
                document.getElementById("login-error").classList = "login-error visible";
    }
}

function forgotPassword(){
    document.getElementById("login-error").innerHTML = "loading...";
    //getting variables
    var username = document.getElementById("username_field").value;
    
    if(username != ""){
        var result = forgotlogin(username);
        document.getElementById("login-error").innerHTML = result;
        document.getElementById("login-error").classList = "login-error visible";
    }
    else{
        document.getElementById("login-error").innerHTML = "Your email cannot be null.";
        document.getElementById("login-error").classList = "login-error visible";
    }
}

window.addEventListener("load", (event) => {
    var u = localStorage.getItem("u");
    var p = localStorage.getItem("p");

    document.getElementById("username_field").value = u;
    document.getElementById("passwordInput").value = p;
});
