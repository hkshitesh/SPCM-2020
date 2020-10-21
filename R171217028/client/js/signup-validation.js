$(document).ready(function() {
    function load() { //Empty fields on start
        $("#email").val("");
        $("#password").val("");
        $("#mobileNumber").val("");
        $("#firstName").val("");
        $("#lastName").val("");
        $("#email").focus();
    }
    load();
    $("#email").focusout(function() {
        $("#email_feedback").css("display", "none");
    });
    //--------------------------------------------------
    $("#email").on('keyup keypress focus', function() {
        var patt = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if ($(this).val() === "") {
            $("#email_feedback").css("display", "block").html("Enter your Email?");
            $(this).removeClass("is-valid").addClass("is-invalid");
        } else if (!patt.test($(this).val())) {
            $("#email_feedback").css("display", "block").html("Invalid Email!");
            $(this).removeClass("is-valid").addClass("is-invalid");
        } else {
            $("#email").removeClass("is-invalid").addClass("is-valid");
            $("#email_feedback").css("display", "none");
        }
    });
    //--------------------------------------------------
    $("#mobileNumber").focusout(function() {
        $("#mobileNumber_feedback").css("display", "none");
    });
    //--------------------------------------------------
    $("#mobileNumber").on('keyup keypress focus', function() {
        var patt = /^[6-9]\d{9}$/;
        if ($(this).val() === "") {
            $("#mobileNumber_feedback").css("display", "block").html("Enter your Phone Number?");
            $(this).removeClass("is-valid").addClass("is-invalid");
        } else if (!patt.test($(this).val())) {
            $("#mobileNumber_feedback").css("display", "block").html("Invalid, Phone Number must be of 10 digits not begining with 0!");
            $(this).removeClass("is-valid").addClass("is-invalid");
        } else {
            $("#mobileNumber").removeClass("is-invalid").addClass("is-valid");
            $("#mobileNumber_feedback").css("display", "none");
        }
    });
    //--------------------------------------------------
    $('#password').on('keyup keypress focus', function(e) {
        var patt = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (patt.test($(this).val())) {
            $("#password_feedback").css("display", "none");
            $(this).removeClass("is-invalid").addClass("is-valid");
        } else {
            $("#password_feedback").css("display", "block").html("Enter password with atleast: <br>1 capital letter <br>1 special character<br>1 digit <br>1 small letter <br>Total of 8 characters.");
            $(this).removeClass("is-valid").addClass("is-invalid");
        }
    });
    //--------------------------------------------------
    $("#password").focusout(function() {
        $("#password_feedback").css("display", "none");
    });
    //--------------------------------------------------
    $(".isNull").on('keyup keypress focus', function() {
        if ($(this).val() === "") {
            $(this).removeClass("is-valid").addClass("is-invalid");
        } else {
            $(this).removeClass("is-invalid").addClass("is-valid");
        }
    });
    //---------------------------------------------------
    $("#signup").click(function() {
        if ($("#email").hasClass("is-valid") &&
            $("#password").hasClass("is-valid") &&
            $("#mobileNumber").hasClass("is-valid") &&
            $("#firstName").hasClass("is-valid") &&
            $("#lastName").hasClass("is-valid")) {
            $("#signupForm").submit();
        } else {
            $("#txtToast").html("Enter required fields!");
            $('.toast').toast('show');
        }
    });
    //-------------------------------------------------
    $("#signupForm").on('submit', (function(e) {
        e.preventDefault();
        var formData = new FormData(this);
        var object = {};
        formData.forEach(function(value, key) {
            object[key] = value;
        });
        var json = JSON.stringify(object);

        $.ajax({
            type: 'POST', // Type of request to be send, called as method
            url: 'http://184.72.85.251:3000/user/signup', // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                console.log(response);
                $("#txtToast").html(response.message);
                $('.toast').toast('show');
                if (!response.error) {
                    setTimeout(function() {
                        window.location.href = "index.html";
                    }, 1500);
                }
            },
            error: function(response) { // A function to be called if request failed
                console.error(response);
                $("#txtToast").html(response.responseJSON.message);
                $('.toast').toast('show');
            }
        });
    }));
});
