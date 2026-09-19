var localStorage = window.localStorage;

//logs into the users account
function login(username, password, callback){
    httpPost("/v1/api/oauthv2", 'username=' + username + '&password=' + password + '&tokenId=2WtmuzuAr1d5jT7sxRA9O4vm1gxsE848loMnroDLau97PTqucgYL19CQhRqF9Kim', function(data){
        var response = JSON.parse(data);

        //checking for errors response["CODE"] != 200
        if(response["AuthToken"] == null){
            callback(response["ERROR"]);
        }
        else{
            //saving the token
            localStorage.setItem("token", response["AuthToken"]["TOKEN"]);
            localStorage.setItem("username", response["Username"]);
            localStorage.setItem("permissions", response["Permissions"]);

            callback( "CONTINUE");
        }
    });
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
function checkLoginToken(token, callback){
    httpPostWithAuth("/v1/api/token", token, "", function(data){
        var response = JSON.parse(data);
        console.log(response);

        if(response["ERROR"] == null){
            callback([true, response['MESSAGE']]);
        }
        else{
            callback([false, 0]);
        }
    });
}

//loads the login cookie and checks wether 
function loadLoginCookie(){
    var cookie = localStorage.getItem("token");

    //checking if the cookie is valid
    if(cookie != null || cookie != ""){
        checkLoginToken(cookie, function(response){
            //OK
            if(response[0] == true){
                //redirect("dashboard.html");
                localStorage.removeItem("authRedirect");
                localStorage.setItem("permissions", response[1]);
            }
            //NOT OK
            else{
                //get query params and post data
                const queryString = window.location;
                //const urlParams = new URLSearchParams(queryString);
                //const q = urlParams.get('q');

                localStorage.setItem("authRedirect", queryString.href);

                redirect("index.html");

                if(getDebugMode()){
                    redirect("index.html?debug_mode=true");
                }
                else{
                    redirect("index.html");
                }
            }
        });

    }
}