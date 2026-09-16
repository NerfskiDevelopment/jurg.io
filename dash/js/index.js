function login_clicked(){
    //getting variables
    var username = document.getElementById("username_field").value;
    var password = document.getElementById("password_field").value;

    //getting result
    var result = login(username, password);

    //checking result
    if(result == "CONTINUE"){
        document.getElementById("login-error").innerHTML = "loading...";
        redirect("dashboard.html");
    }
    //throwing error
    else{
        document.getElementById("login-error").innerHTML = result;
    }
}

function forgotPassword(){
    document.getElementById("login-error").innerHTML = "loading...";
    //getting variables
    var username = document.getElementById("username_field").value;
    
    if(username != ""){
        var result = forgotlogin(username);
        document.getElementById("login-error").innerHTML = result;
    }
    else{
        document.getElementById("login-error").innerHTML = "Your email cannot be null.";
    }
}