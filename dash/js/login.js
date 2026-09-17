var localStorage = window.localStorage;

//logs into the users account
function login(username, password){
    var response = JSON.parse(httpPost("/v1/api/oauthv2", 'username=' + username + '&password=' + password + '&tokenId=2WtmuzuAr1d5jT7sxRA9O4vm1gxsE848loMnroDLau97PTqucgYL19CQhRqF9Kim'));

    //checking for errors response["CODE"] != 200
    if(response["AuthToken"] == null){
        return response["ERROR"];
    }
    else{
        //saving the token
        localStorage.setItem("token", response["AuthToken"]["TOKEN"]);
        localStorage.setItem("username", response["Username"]);
        localStorage.setItem("permissions", response["Permissions"]);

        return "CONTINUE";
    }
}

function forgotlogin(username){
    var response = JSON.parse(httpPost("/v2/api/forgotv2", 'username=' + username + '&tokenId=2WtmuzuAr1d5jT7sxRA9O4vm1gxsE848loMnroDLau97PTqucgYL19CQhRqF9Kim'));

    if(response["CODE"] == 200){
        return "An email has been sent to your inbox.";
    }
    else{
        return response["ERROR"];
    }
}

//will logout the user
function logout(){
    localStorage.setItem("token", "");
    redirect("index.html");
}

//checks wether the token is valid or not
function checkLoginToken(token){
    var response = JSON.parse(httpPostWithAuth("/v1/api/token", token));

    if(response["ERROR"] == null){
        return [true, response['MESSAGE']];
    }
    else{
        return [false, 0];
    }
}

//loads the login cookie and checks wether 
function loadLoginCookie(){
    var cookie = localStorage.getItem("token");

    //checking if the cookie is valid
    if(cookie != null || cookie != ""){
        var response = checkLoginToken(cookie);

        //OK
        if(response[0] == true){
            //redirect("dashboard.html");
            localStorage.setItem("permissions", response[1]);
        }
        //NOT OK
        else{
            redirect("index.html");
        }
    }
    else{
        //
    }
}