function login_clicked(){
    //getting variables
    var username = document.getElementById("username_field").value;
    var password = document.getElementById("passwordInput").value;

    //getting result
    var result = login(username, password, function(result){
        //checking result
        if(result == "CONTINUE"){
            localStorage.setItem("u", username);
            localStorage.setItem("p", password);
            document.getElementById("login-error").innerHTML = "loading...";

            var a = localStorage.getItem("authRedirect");

            if(a != "" && a != null){
                
                localStorage.removeItem("authRedirect");
                window.location.href = a;
            }
            else{
                var ext = '';
                if(getDebugMode()){
                    ext = '?debug_mode=true';
                }

                //console.log(ext);
                redirect("dashboard.html" + ext);
            }            
        }
        //throwing error
        else{
            document.getElementById("login-error").innerHTML = result;
                    document.getElementById("login-error").classList = "login-error visible";
        }
    });
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
    var u = localStorage.getItem("u");
    var p = localStorage.getItem("p");

    document.getElementById("username_field").value = u;
    document.getElementById("passwordInput").value = p;
});
