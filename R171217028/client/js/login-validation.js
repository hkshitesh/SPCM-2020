$(document).ready(function() {

    $("#email").focus();

    if (getCookie("authToken") && getCookie("userId"))
        window.location.href = "dashboard.html";

    function load() { //Empty fields on start
        $("#email").val("");
        $("#password").val("");
        $("#email").focus();
    }
    load();
    //-----------------------------------------------
    $("#login").click(function() {
        //check for valid text if not show alert
        if ($("#email").hasClass("is-invalid") ||
            $("#password").hasClass("is-invalid")
        ) {
            $("#txtToast").html("Enter Required Values!");
            $('.toast').toast('show'); //show response on toast
        } else {
            $("#loginForm").submit();
        }
    });
    //-------------------------------------------------
    $("#loginForm").on('submit', (function(e) {
        e.preventDefault();
        var formData = new FormData(this);
        var object = {};
        formData.forEach(function(value, key) {
            object[key] = value;
        });
        var json = JSON.stringify(object);

        $.ajax({
            type: 'POST', // Type of request to be send, called as method
            url: 'http://184.72.85.251:3000/user/login', // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                $("#txtToast").html(response.message);
                $('.toast').toast('show');
                setCookie("userId", response.data.userId, 365);
                setCookie("authToken", response.data.authToken, 365);
                setTimeout(function() {
                    window.location.href = "dashboard.html";
                }, 1500);
            },
            error: function(response) { // A function to be called if request failed
                $("#txtToast").html(response.responseJSON.message);
                $('.toast').toast('show');
            }
        });
    }));
    //-------------------------------------------------
    $(".checkNull").blur(function() { //check for null values inside fields
        var txt = $(this).val();
        if (txt === "")
            $(this).addClass("is-invalid");
        else
            $(this).removeClass("is-invalid");
    });
});
