$(document).ready(function() {

    socket.on("online-user@" + authToken, (userId) => {
        let sender = $(`.sender .sender-id:contains(${userId})`).parents(".sender");
        $(sender).find(".sender-message-status").show();
        $(sender).find(".sender-last-seen").hide();
    });
    //-------------------------------------------------
    socket.on("last-seen@" + authToken, (user) => {
        let sender = $(`.sender .sender-id:contains(${user.userId})`).parents(".sender");
        $(sender).find(".sender-message-status").hide();
        if (formatDate(user.lastSeen) == formatDate(new Date()))
            $(sender).find(".sender-last-seen-text").text(changeTo12Hour(user.lastSeen));
        else
            $(sender).find(".sender-last-seen-text").text(formatDate(user.lastSeen) + " " + changeTo12Hour(user.lastSeen));
        $(sender).find(".sender-last-seen").show();

    });
    //-------------------------------------------------
    socket.on("receive-single@" + authToken, (data) => { //Message received

        let sender = $(`.sender .sender-name:contains(${data.senderName})`).parents(".sender"); //get sender's element who's message came

        //Add message to chatbox
        if ($(sender).hasClass("active")) { //Check if the user has openned the chat of the person who's message came
            $("#no-message").hide()
            $('#unread-messages').hide();

            let parent = $("#message-recieved-block").parent();
            let message = $("#message-recieved-block").clone();
            $(message).find(".message-recieved").text(data.message);
            $(message).find(".time").text(changeTo12Hour(data.createdOn));
            $(message).find(".message-recieved-id").val(data.chatId);
            $(message).find(".message-name").text(data.senderName);
            $(message).prop("id", "").prop("hidden", false);
            $(parent).append($(message));

            setUnseenChatsInChatBox([data.chatId], data.senderId, 'single');
        } else {
            setUndeliveredMessagesInChatBox([data.chatId], data.senderId, 'single');
        }


        //Add message to userlist
        $(sender).find(".sender-message").text(data.message);
        $(sender).find(".sender-message-date").text(" ");
        $(sender).find(".sender-message-time").text(changeTo12Hour(data.createdOn));

        let unreadCount = parseInt($(sender).find(".sender-unread-messages-count").text()) + 1;
        $(sender).find(".sender-unread-messages-count").text(unreadCount);
        $(sender).find(".sender-unread-messages-count").show();


        let parent = $(sender).parent();
        let clone = $(sender).clone();
        $(sender).remove();
        $(parent).prepend($(clone));
        sender = clone;

        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);

    });

    //-------------------------------------------------
    socket.on("typing-single@" + authToken, (id) => {
        setTimeout(function() {
            let sender = $(`.sender .sender-id:contains(${id})`).parent();
            $(sender).find(".sender-message-typing").hide();
            $(sender).find(".sender-message").show();
        }, 1000);
        let sender = $(`.sender .sender-id:contains(${id})`).parent();
        $(sender).find(".sender-message").hide();
        $(sender).find(".sender-message-typing").show();

    });
    //-------------------------------------------------
    socket.on("seen-single@" + authToken, (data) => {

        if ($(".sender.active .sender-id").text() == data.receiverId) {

            for (let i = 0; i < data.chatIds.length; i++) {
                let chatId = data.chatIds[i];
                $($(".message-sent-id").get().reverse()).each(function() {
                    let chatId = data.chatIds[i];
                    if ($(this).val() == chatId) {
                        let parent = $(this).parent();

                        $(parent).find(".status-sent").hide();
                        $(parent).find(".status-delivered").hide();
                        $(parent).find(".status-seen").slideDown();
                        i++;
                        if (i >= data.chatIds.length)
                            return false;
                    }
                });
            }
        }

    });
    //-------------------------------------------------
    socket.on("delivered-single@" + authToken, (data) => {

        if ($(".sender.active .sender-id").text() == data.receiverId) {

            for (let i = 0; i < data.chatIds.length; i++) {
                $($(".message-sent-id").get().reverse()).each(function() {
                    let chatId = data.chatIds[i];
                    if ($(this).val() == chatId) {
                        let parent = $(this).parent();

                        $(parent).find(".status-sent").hide();
                        $(parent).find(".status-delivered").slideDown();
                        $(parent).find(".status-seen").hide();
                        i++;
                        if (i >= data.chatIds.length)
                            return false;
                    }
                });
            }
        }

    });
    //-------------------------------------------------
    $('body').on('click', '.sender-dropdown-spam', function(e) {
        let sender = $(this).parents(".sender");
        let id = $(sender).find(".sender-id").text();
        //Send API
        let object = {
            userId: id,
            authToken: authToken
        }
        let json = JSON.stringify(object);

        $.ajax({
            type: 'PUT', // Type of request to be send, called as method
            url: `${baseUrl}/user/spam`, // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                $("#txtToast").html(response.message);
                $('.toast').toast('show');
                $(sender).remove();
            },
            error: function(response) { // A function to be called if request failed
                console.error(response);
            }
        });
    });
    //-------------------------------------------------
    $('body').on('click', '.sender-dropdown-block', function(e) {
        let sender = $(this).parents(".sender");
        let id = $(sender).find(".sender-id").text();
        //Send API
        let object = {
            userId: id,
            authToken: authToken
        }
        let json = JSON.stringify(object);

        $.ajax({
            type: 'PUT', // Type of request to be send, called as method
            url: `${baseUrl}/user/block`, // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                $("#txtToast").html(response.message);
                $('.toast').toast('show');
                $(sender).find('.sender-dropdown-block').hide();
                $(sender).find('.sender-dropdown-unblock').show();
                $(sender).find('.sender-blocked').show();
                $(sender).addClass('blocked');
                if ($(sender).hasClass('active'))
                    $(sender).trigger('click');

                let user = $(`.user .user-id:contains(${id})`).parents(".user");
                $(user).find('.user-blocked').show();
            },
            error: function(response) { // A function to be called if request failed
                console.error(response);
            }
        });
    });
    //-------------------------------------------------
    $('body').on('click', '.sender-dropdown-unblock', function(e) {
        let sender = $(this).parents(".sender");
        let id = $(sender).find(".sender-id").text();
        //Send API
        let object = {
            userId: id,
            authToken: authToken
        }
        let json = JSON.stringify(object);

        $.ajax({
            type: 'PUT', // Type of request to be send, called as method
            url: `${baseUrl}/user/unblock`, // Url to which the request is send
            data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
            cache: false, // To unable request pages to be cached
            contentType: 'application/json', // The content type used when sending data to the server.
            processData: false, // To send DOMDocument or non processed data file it is set to false
            success: function(response) { // A function to be called if request succeeds
                $("#txtToast").html(response.message);
                $('.toast').toast('show');
                $(sender).find('.sender-dropdown-unblock').hide();
                $(sender).find('.sender-blocked').hide();
                $(sender).find('.sender-dropdown-block').show();
                $(sender).removeClass('blocked');
                if ($(sender).hasClass('active'))
                    $(sender).trigger('click');

                let user = $(`.user .user-id:contains(${id})`).parents(".user");
                $(user).find('.user-blocked').hide();
            },
            error: function(response) { // A function to be called if request failed
                console.error(response);
            }
        });
    });
});
