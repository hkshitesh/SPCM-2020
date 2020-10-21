const baseUrl = 'http://184.72.85.251:3000';
const socket = io(baseUrl); // connecting with sockets.
const authToken = getCookie("authToken");
const userId = getCookie("userId");
let userName = "";
let skip = 0;

//=======================================================================================================
$(document).ready(function() {

    //---------------------------------------------------------------------------------------------------
    function initialize() {

        if (!authToken || !userId)
            $("#logout").trigger('click');

        //-------------------------------------------------
        socket.on('verifyUser', (data) => { //verify user from auth Token

            console.log("socket trying to verify user");

            socket.emit("set-user", authToken, userId);

        });
        //-------------------------------------------------
        socket.on("auth-error", (jsonData) => {

            console.error(jsonData);
            $("#logout").trigger('click');

        });
        //-------------------------------------------------
        $("#logout").click(function() {

            $.ajax({
                type: 'POST', // Type of request to be send, called as method
                url: `${baseUrl}/user/logout`, // Url to which the request is send
                data: JSON.stringify({ authToken: authToken }), // Data sent to server, a set of key/value pairs (i.e. form fields and values)
                cache: false, // To unable request pages to be cached
                contentType: 'application/json', // The content type used when sending data to the server.
                processData: false, // To send DOMDocument or non processed data file it is set to false
                success: function(response) { // A function to be called if request succeeds
                    setCookie("userId", userId, -1); //Delete cookies
                    setCookie("authToken", authToken, -1); //Delete cookies

                    $("#txtToast").html(response.message);
                    $('.toast').toast('show');
                    setTimeout(function() {
                        window.location.href = "index.html";
                    }, 1500);
                },
                error: function(response) { // A function to be called if request failed
                    console.error(response);
                    $("#txtToast").html(response.message);
                    $('.toast').toast('show'); //show response on toast
                }
            });
        });
        //-------------------------------------------------
        //Local Function-->

        let getAllUsers = () => {
            return new Promise((resolve, reject) => {
                $.get(`${baseUrl}/user/all`, { authToken: authToken },
                    function(response, status, xhr) {
                        if (response.status == 200) {
                            let data = response.data;

                            for (let i = 0; i < data.length; i++) {
                                if (data[i].userId == userId)
                                    continue;
                                let parent = $("#sender").parent();
                                let sender = $("#sender").clone();
                                $(sender).find(".sender-name").text(data[i].firstName + " " + data[i].lastName);
                                $(sender).find(".sender-id").text(data[i].userId);
                                $(sender).find(".sender-img .img").text(data[i].firstName[0] + data[i].lastName[0]);
                                if ($(sender).find(".sender-message-status").css("display") == "none" && data[i].lastSeen) {
                                    if (formatDate(data[i].lastSeen) == formatDate(new Date()))
                                        $(sender).find(".sender-last-seen-text").text(changeTo12Hour(data[i].lastSeen));
                                    else
                                        $(sender).find(".sender-last-seen-text").text(formatDate(data[i].lastSeen) + " " + changeTo12Hour(data[i].lastSeen));
                                } else {
                                    $(sender).find(".sender-last-seen").hide();
                                }
                                $(sender).prop("hidden", false).prop("id", "");
                                $(parent).append($(sender));

                                let userParent = $("#user").parent();
                                let user = $("#user").clone();
                                $(user).find(".user-name").text(data[i].firstName + " " + data[i].lastName);
                                $(user).find(".user-id").text(data[i].userId);
                                $(user).find(".user-img .img").text(data[i].firstName[0] + data[i].lastName[0]);
                                $(user).prop("hidden", false).prop("id", "");
                                $(userParent).append($(user));

                            }

                            resolve();
                        } else {
                            reject(`${baseUrl}/user/all not working`);
                        }
                    }, "json");
            });
        };
        //*****************************************************
        let getUserInfo = () => {
            return new Promise((resolve, reject) => {
                $.get(`${baseUrl}/user/`, { authToken: authToken },
                    function(response, status, xhr) {

                        if (response.status == 200) {
                            let data = response.data;
                            userName = data.firstName + " " + data.lastName;
                            $("#name").text(userName);

                            for (let i = 0; i < data.blocked.length; i++) {
                                let id = data.blocked[i].user_id.userId;
                                let sender = $(`.sender .sender-id:contains(${id})`).parents(".sender");
                                $(sender).find('.sender-dropdown-block').hide();
                                $(sender).find('.sender-dropdown-unblock').show();
                                $(sender).find('.sender-blocked').show();
                                $(sender).addClass('blocked');

                                let user = $(`.user .user-id:contains(${id})`).parents(".user");
                                $(user).find('.user-blocked').show();
                            }

                            //Adding groups
                            socket.emit("configure-groups", { groups: data.groups, authToken: authToken, userId: userId });
                            for (let i = 0; i < data.groups.length; i++) {

                                let parent = $("#group").parent();
                                let group = $("#group").clone();
                                $(group).find(".group-name").text(data.groups[i].group_id.name);
                                $(group).find(".group-id").text(data.groups[i].group_id.groupId);

                                let name = data.groups[i].group_id.name.toUpperCase().split(' ');
                                let firstName = name[0];
                                let lastName = name[1] ? name[1] : ' ';
                                $(group).find(".group-img .img").text(firstName[0] + lastName[0]);

                                $(group).prop("hidden", false).prop("id", "");
                                $(parent).append($(group));

                            }

                            resolve();
                        } else {
                            reject(`${baseUrl}/user/ not working`);
                        }
                    },
                    "json");
            });
        };
        //*****************************************************
        let markUndeliveredSingleChats = () => {
            return new Promise((resolve, reject) => {

                $.ajax({
                    type: 'PUT', // Type of request to be send, called as method
                    url: `${baseUrl}/chat/single/delivered/mark/all`, // Url to which the request is send
                    data: JSON.stringify({ authToken: authToken }), // Data sent to server, a set of key/value pairs (i.e. form fields and values)
                    cache: false, // To unable request pages to be cached
                    contentType: 'application/json', // The content type used when sending data to the server.
                    processData: false, // To send DOMDocument or non processed data file it is set to false
                    success: function(response) { // A function to be called if request succeeds
                        if (response.status == 200) {
                            console.log(response.message);

                            let undeliveredChats = response.data;
                            if (undeliveredChats) {

                                let senderId = undeliveredChats[0].senderId;
                                let chatIds = Array();

                                for (let i = 0; i < undeliveredChats.length; i++) {

                                    chatIds.push(undeliveredChats[i].chatId);
                                    if (senderId != undeliveredChats[i].senderId ||
                                        i == undeliveredChats.length - 1) {
                                        let query = {
                                            chatIds: chatIds,
                                            senderId: senderId,
                                            authToken: authToken,
                                            receiverId: userId
                                        };
                                        socket.emit("delivered-single", query);
                                        senderId = undeliveredChats[i].senderId;
                                        chatIds = Array();
                                    }
                                }

                            }
                            resolve();
                        } else {
                            reject(response.message);
                        }
                    },
                    error: function(response) { // A function to be called if request failed
                        console.error(response);
                        reject(`${baseUrl}/chat/single/undelivered not working`);
                    }
                });
            });
        };
        //*****************************************************
        let markUndeliveredGroupChats = () => {
            return new Promise((resolve, reject) => {

                $.ajax({
                    type: 'PUT', // Type of request to be send, called as method
                    url: `${baseUrl}/chat/group/delivered/mark/all`, // Url to which the request is send
                    data: JSON.stringify({ authToken: authToken }), // Data sent to server, a set of key/value pairs (i.e. form fields and values)
                    cache: false, // To unable request pages to be cached
                    contentType: 'application/json', // The content type used when sending data to the server.
                    processData: false, // To send DOMDocument or non processed data file it is set to false
                    success: function(response) { // A function to be called if request succeeds
                        if (response.status == 200) {
                            console.log(response.message);

                            let undeliveredChats = response.data;
                            if (undeliveredChats) {

                                let groupId = undeliveredChats[0].groupId;
                                let chatIds = Array();
                                let senderIds = Array();
                                let date = Date.now();
                                for (let i = 0; i < undeliveredChats.length; i++) {

                                    chatIds.push(undeliveredChats[i].chatId);
                                    senderIds.push(undeliveredChats[i].senderId);
                                    if (groupId != undeliveredChats[i].groupId ||
                                        i == undeliveredChats.length - 1) {
                                        let query = {
                                            chatIds: chatIds,
                                            groupId: groupId,
                                            authToken: authToken,
                                            senderIds: senderIds,
                                            receiverId: userId,
                                            receiverName: userName,
                                            createdOn: date
                                        };
                                        socket.emit("delivered-group", query);
                                        groupId = undeliveredChats[i].groupId;
                                        chatIds = Array();
                                        senderIds = Array();
                                    }

                                }

                            }
                            resolve();
                        } else {
                            reject(response.message);
                        }
                    },
                    error: function(response) { // A function to be called if request failed
                        console.error(response);
                        reject(`${baseUrl}/chat/group/undelivered not working`);
                    }
                });
            });
        };
        //*****************************************************
        let getSingleLastChat = () => {
            return new Promise((resolve, reject) => {

                $.get(`${baseUrl}/chat/single/lastchat`, { authToken: authToken }, function(response, status, xhr) {
                    if (response.status == 200) {
                        let chats = response.data;
                        if (chats) {
                            console.log(`Single Last Chat Found`);

                            for (let i = chats.length - 1; i >= 0; i--) {
                                //Add last message to userlist
                                let sender = $(`.sender .sender-id:contains(${chats[i].senderId})`).parents(".sender");
                                $(sender).find(".sender-message").text(chats[i].message);
                                $(sender).find(".sender-message-time").text(changeTo12Hour(chats[i].createdOn));
                                if (formatDate(chats[i].createdOn) == formatDate(new Date()))
                                    $(sender).find(".sender-message-date").text(" ");
                                else
                                    $(sender).find(".sender-message-date").text(formatDate(chats[i].createdOn));
                                let parent = $(sender).parent();
                                let clone = $(sender).clone();
                                $(sender).remove();
                                $(parent).prepend($(clone));
                            }

                        }
                        resolve();
                    } else {
                        reject(`${baseUrl}/chat/single/lastchat not woking`);
                    }
                });
            });
        };
        //*****************************************************
        let getGroupLastChat = () => {
            return new Promise((resolve, reject) => {

                $.get(`${baseUrl}/chat/group/lastchat`, { authToken: authToken }, function(response, status, xhr) {
                    if (response.status == 200) {
                        let chats = response.data;
                        if (chats) {
                            console.log(`Group Last Chat Found`);

                            let senderList = $(".sender:not(#sender)");
                            let index = 0; //index where to place group
                            for (let i = 0; i < chats.length; i++) {
                                //Add last message to userlist
                                let group = $(`.group .group-id:contains(${chats[i].groupId})`).parents(".group");
                                $(group).find(".group-message").text(chats[i].message);
                                $(group).find(".group-message-time").text(changeTo12Hour(chats[i].createdOn));
                                if (formatDate(chats[i].createdOn) == formatDate(new Date()))
                                    $(group).find(".group-message-date").text(" ");
                                else
                                    $(group).find(".group-message-date").text(formatDate(chats[i].createdOn));

                                let clone = $(group).clone();
                                $(group).remove();
                                while (index < senderList.length) {
                                    let time = $(senderList[index]).find(".sender-message-time").text();
                                    if (!time.trim()) {
                                        $(senderList[index]).before(clone);
                                        break;
                                    }
                                    let date = $(senderList[index]).find(".sender-message-date").text();
                                    if (!date.trim()) {
                                        date = formatDate(Date.now());
                                    }

                                    let senderChatCreatedOn = new Date(unformatDate(date) + " " + change12HourTo24Hour(time))
                                    let groupChatCreatedOn = new Date(chats[0].createdOn);
                                    if (groupChatCreatedOn > senderChatCreatedOn) {
                                        $(senderList[index]).before(clone);
                                        break;
                                    } else {
                                        index++;
                                    }
                                }
                                if (index == senderList.length) {
                                    $(senderList[index - 1]).after(clone);
                                }
                            }

                        }
                        resolve();
                    } else {
                        reject(`${baseUrl}/chat/group/lastchat not woking`);
                    }
                });
            });
        };
        //*****************************************************
        let countUnseenSingleChats = () => {
            return new Promise((resolve, reject) => {

                $.get(`${baseUrl}/chat/single/unseen/count`, { authToken: authToken }, function(response, status, xhr) {
                    if (response.status == 200) {
                        let data = response.data;

                        for (let i = 0; i < data.length; i++) {
                            if (data[i].count > 0) {
                                let sender = $(`.sender .sender-id:contains(${data[i].senderId})`).parents(".sender");
                                $(sender).find(".sender-unread-messages-count").text(data[i].count).show();
                            }
                        }
                        console.log(`Unread Single Chat Found`);
                        resolve();
                    } else {
                        reject(`${baseUrl}/chat/single/unseen/count not working`);
                    }
                });
            });
        };
        //*****************************************************
        let countUnseenGroupChats = () => {
            return new Promise((resolve, reject) => {

                $.get(`${baseUrl}/chat/group/unseen/count`, { authToken: authToken }, function(response, status, xhr) {

                    if (response.status == 200) {
                        let data = response.data;

                        for (let i = 0; i < data.length; i++) {
                            if (data[i].count > 0) {
                                let group = $(`.group .group-id:contains(${data[i].groupId})`).parents(".group");
                                $(group).find(".group-unread-messages-count").text(data[i].count).show();
                            }
                        }
                        console.log(`Unread Group Chat Found`);
                        resolve();
                    } else {
                        reject(`${baseUrl}/chat/group/unseen/count not working`);
                    }
                });
            });
        }

        //-->Local Function

        getAllUsers()
            .then(getUserInfo)
            .then(markUndeliveredSingleChats)
            .then(markUndeliveredGroupChats)
            .then(getSingleLastChat)
            .then(getGroupLastChat)
            .then(countUnseenSingleChats)
            .then(countUnseenGroupChats)
            .then(() => {
                console.log("Initialization Done.");
            })
            .catch((err) => {
                console.error(err);
            });
    }

    initialize();

    //---------------------------------------------------------------------------------------------------

    $("#sender-search").on('keyup change', function() {
        let text = $(this).val().toLowerCase();
        $(".sender:not(#sender),.group:not(#group)").show();
        $(".sender:not(#sender),.group:not(#group)").filter(function() {
            if ($(this).hasClass('sender')) {
                if ($(this).find(".sender-name").text().toLowerCase().indexOf(text) == -1 &&
                    $(this).find(".sender-message").text().toLowerCase().indexOf(text) == -1)
                    return true;
                else
                    return false;
            } else {
                if ($(this).find(".group-name").text().toLowerCase().indexOf(text) == -1 &&
                    $(this).find(".group-message").text().toLowerCase().indexOf(text) == -1)
                    return true;
                else
                    return false;
            }

        }).hide();
    });
    //-------------------------------------------------
    socket.on("auth-error@" + authToken, (jsonData) => {

        console.error(jsonData);
        setCookie("userId", userId, -1); //Delete cookies
        setCookie("authToken", authToken, -1); //Delete cookies
        setCookie("name", userName, -1); //Delete cookies

        $("#txtToast").html(jsonData.error);
        $('.toast').toast('show');
        window.location.href = "index.html";

    });
    //-------------------------------------------------
    $("#message").on('keypress', function() {
        let apiType;
        let data = {
            senderId: userId,
            senderName: userName,
            authToken: authToken
        };

        if ($("#chatBox").hasClass("group-message")) {
            apiType = 'group';

            data['groupId'] = $(".group.active").find(".group-id").text();
        } else {
            apiType = 'single';

            data['receiverId'] = $(".sender.active").find(".sender-id").text();
        }

        socket.emit(`typing-${apiType}`, data);

    });
    //-------------------------------------------------
    $("#message").on('keypress', function(e) {
        if (e.keyCode == 13) {
            $("#send").trigger("click");
        }
    });
    //-------------------------------------------------
    $("#send").on('click', function() {

        if ($("#message").val().trim() == "")
            return false;

        let chatMessage = {
            createdOn: Date.now(),
            senderId: userId,
            senderName: userName,
            message: $("#message").val()
        }

        let apiType;
        if ($("#chatBox").hasClass('group-message')) {

            apiType = 'group';

            chatMessage['groupId'] = $(".group.active").find(".group-id").text();
            chatMessage['groupName'] = $(".group.active").find(".group-name").text();

            //Add message to userlist
            let group = $(`.group .group-id:contains(${chatMessage.groupId})`).parents(".group");
            $(group).find(".group-message").text(chatMessage.message);
            $(group).find(".group-message-time").text(changeTo12Hour(chatMessage.createdOn));
            $(group).find(".group-message-date").text(" ");
            let parent = $(group).parent();
            let clone = $(group).clone();
            $(group).remove();
            $(parent).prepend($(clone));

        } else {

            apiType = 'single';

            chatMessage['receiverId'] = $(".sender.active").find(".sender-id").text();
            chatMessage['receiverName'] = $(".sender.active").find(".sender-name").text();

            //Add message to userlist
            let sender = $(`.sender .sender-id:contains(${chatMessage.receiverId})`).parents(".sender");
            $(sender).find(".sender-message").text(chatMessage.message);
            $(sender).find(".sender-message-time").text(changeTo12Hour(chatMessage.createdOn));
            $(sender).find(".sender-message-date").text(" ");
            let parent = $(sender).parent();
            let clone = $(sender).clone();
            $(sender).remove();
            $(parent).prepend($(clone));

        }

        //Add message to chatbox
        parent = $("#message-sent-block").parent();
        let message = $("#message-sent-block").clone();
        $(message).find(".message-sent").text(chatMessage.message);
        $(message).find(".time").text(changeTo12Hour(chatMessage.createdOn));
        $(message).find(".status-sent").slideDown();
        $(message).prop("id", "").prop("hidden", false);
        $(parent).append($(message)).fadeIn('slow');

        let data = {
            authToken: authToken,
            chatMessage: chatMessage
        }

        $("#message").val("");
        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
        $("#no-message").hide()
        $('#unread-messages').hide();

        socket.emit(`${apiType}-chat-msg`, data)

    });
    //-------------------------------------------------
    socket.on("getChatId@" + authToken, function(chatId) {
        $('.message-sent-block').last().find(".message-sent-id").val(chatId);
    });
    //-------------------------------------------------
    $('body').on('click', '.sender,.group', function(e) { //click event on each sender for dynamic elements

        let messageSender = $(this);
        let apiType;
        if ($(this).hasClass("group")) {
            apiType = 'group';
            $("#chatBox").addClass("group-message"); //add group template from chatbox
        } else {
            apiType = 'single';
            $("#chatBox").removeClass("group-message"); //Remove group template from chatbox
        }

        let blocked = false;
        if ($(this).hasClass("blocked")) {
            blocked = true;
            $("#block-message").prop("hidden", false);
            $("#send-message").prop("hidden", true);
        } else {
            $("#send-message").prop("hidden", false);
            $("#block-message").prop("hidden", true);
        }

        $("#welcome").hide();

        //Remove all others senders and groups from active and current sender as active
        $(".sender").removeClass("active");
        $(".group").removeClass("active");

        //Remove all dates
        $(".date:not(#date)").remove();
        //Remove all sent chats
        $(".message-sent-block:not(#message-sent-block)").remove();
        //Remove all recieved chats
        $(".message-recieved-block:not(#message-recieved-block)").remove();
        //Hide unread messages notification
        $("#unread-messages").hide();
        $(this).find("sender-unread-messages-count").hide();

        //Get current user name and id
        let id, name;
        if (apiType == 'group') {
            id = $(this).find(".group-id").text();
            name = $(this).find(".group-name").text();
        } else {
            id = $(this).find(".sender-id").text();
            name = $(this).find(".sender-name").text();
        }
        let noMessages = true;

        //Local Function-->

        let getUnseenChats = () => { //Get all unseen chat
            return new Promise((resolve, reject) => {

                let date = formatDate(new Date()); //Today's Date
                if (blocked)
                    resolve(date);
                else {

                    let query = {
                        authToken: authToken
                    };
                    if (apiType == 'group') {
                        query['groupId'] = id;
                    } else {
                        query['senderId'] = id;
                    }
                    $.get(`${baseUrl}/chat/${apiType}/unseen`, query, function(response, status, xhr) {
                        if (response.status == 200) {
                            let unseenChats = response.data;
                            if (unseenChats) {
                                console.log("Unseen Chat Found");
                                let unseenMessages = Array();
                                let senderIds = Array();
                                for (let i = 0; i < unseenChats.length; i++) {
                                    unseenMessages.push(unseenChats[i].chatId);
                                    senderIds.push(unseenChats[i].senderId);

                                    let chatCreatedOn = formatDate(unseenChats[i].createdOn);
                                    if (chatCreatedOn != date) {

                                        let parentDate = $("#date").parent();
                                        let newDate = $("#date").clone();
                                        $(newDate).prop("hidden", false).prop("id", "");
                                        if (date == formatDate(new Date()))
                                            $(newDate).text("Today");
                                        else
                                            $(newDate).text(date);
                                        $(parentDate).prepend($(newDate));
                                        date = chatCreatedOn;
                                    }

                                    //Adding unread message to chatbox
                                    let parent = $("#message-recieved-block").parent();
                                    let message = $("#message-recieved-block").clone();
                                    $(message).find(".message-recieved").text(unseenChats[i].message);
                                    $(message).find(".message-recieved-id").val(unseenChats[i].chatId);
                                    $(message).find(".message-name").text(unseenChats[i].senderName);
                                    $(message).find(".time").text(changeTo12Hour(unseenChats[i].createdOn));
                                    $(message).prop("hidden", false).prop("id", "");
                                    $(parent).prepend($(message));

                                }

                                if (apiType == 'group') {
                                    setUnseenChatsInChatBox(unseenMessages, { groupId: id, senderIds: senderIds }, apiType);
                                } else {
                                    setUnseenChatsInChatBox(unseenMessages, id, apiType);
                                }
                                noMessages = false;
                            } else {
                                console.log("No Unseen Chat for " + name);
                            }
                            resolve(date);
                        } else {
                            reject(`${baseUrl}/chat/${apiType}/unseen not working`);
                        }
                    });
                }
            });
        };
        //*****************************************************
        let getSeenChats = (date) => { //Get all seen chat
            return new Promise((resolve, reject) => {

                let query = {
                    authToken: authToken
                };
                if (apiType == 'group') {
                    query['groupId'] = id;
                } else {
                    query['senderId'] = id;
                }

                skip = 10; //skip last 10 chats when scrolling upwards
                $.get(`${baseUrl}/chat/${apiType}/seen`, query, function(response, status, xhr) {

                    if (response.status == 200) {
                        let seenChats = response.data;
                        if (seenChats) {
                            console.log("Seen Chat Found");
                            for (let i = 0; i < seenChats.length; i++) {

                                let chatCreatedOn = formatDate(seenChats[i].createdOn);
                                if (chatCreatedOn != date) {

                                    let parentDate = $("#date").parent();
                                    let newDate = $("#date").clone();
                                    $(newDate).prop("hidden", false).prop("id", "");
                                    if (date == formatDate(new Date()))
                                        $(newDate).text("Today");
                                    else
                                        $(newDate).text(date);
                                    $(parentDate).prepend($(newDate));
                                    date = chatCreatedOn;

                                }

                                if (seenChats[i].senderId == userId) {

                                    let parent = $("#message-sent-block").parent();
                                    let message = $("#message-sent-block").clone();
                                    $(message).find(".message-sent").text(seenChats[i].message);
                                    $(message).find(".message-sent-id").val(seenChats[i].chatId);
                                    $(message).find(".message-name").text(seenChats[i].senderName);
                                    $(message).find(".time").text(changeTo12Hour(seenChats[i].createdOn));

                                    if (apiType == 'group') {
                                        $(message).find(".delivered-count-text").text(parseInt(seenChats[i].deliveredCount));
                                        $(message).find(".seen-count-text").text(parseInt(seenChats[i].seenCount));
                                    } else {
                                        if (seenChats[i].seen)
                                            $(message).find(".status-seen").slideDown();
                                        else if (seenChats[i].delivered)
                                            $(message).find(".status-delivered").slideDown();
                                        else
                                            $(message).find(".status-sent").slideDown();
                                    }
                                    $(message).prop("hidden", false).prop("id", "");
                                    $(parent).prepend($(message));


                                } else {

                                    let parent = $("#message-recieved-block").parent();
                                    let message = $("#message-recieved-block").clone();
                                    $(message).find(".message-recieved").text(seenChats[i].message);
                                    $(message).find(".message-recieved-id").val(seenChats[i].chatId);
                                    $(message).find(".message-name").text(seenChats[i].senderName);
                                    $(message).find(".time").text(changeTo12Hour(seenChats[i].createdOn));
                                    $(message).prop("hidden", false).prop("id", "");
                                    $(parent).prepend($(message));

                                }

                                if (i == seenChats.length - 1) {

                                    let parentDate = $("#date").parent();
                                    let newDate = $("#date").clone();
                                    $(newDate).prop("hidden", false).prop("id", "");
                                    if (date == formatDate(new Date()))
                                        $(newDate).text("Today");
                                    else
                                        $(newDate).text(date);
                                    $(parentDate).prepend($(newDate));

                                }
                            }
                            noMessages = false;
                            resolve();
                        } else {
                            if (noMessages == false) {
                                let parentDate = $("#date").parent();
                                let newDate = $("#date").clone();
                                $(newDate).prop("hidden", false).prop("id", "");
                                if (date == formatDate(new Date()))
                                    $(newDate).text("Today");
                                else
                                    $(newDate).text(date);
                                $(parentDate).prepend($(newDate));
                            }

                            reject("No Seen Chat for " + name);
                        }
                    } else {
                        reject(`${baseUrl}/chat/${apiType}/seen not working`);
                    }

                }, "json");
            });
        };
        //*****************************************************
        let loadOldMessages = () => { //If there is no vertical scrollbar load more messages if possible
            return new Promise((resolve, reject) => {
                $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
                if ($('#chatBox')[0].scrollTop == 0) { //check whether there is no vertical scrollbar showing
                    $(messageSender).addClass("active");
                    $('#chatBox').trigger("scroll");
                    setTimeout(function() {
                        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight); //set vertical scrollbar to bottom
                    }, 200);
                }
                resolve();
            });
        }

        //<--Local Function

        getUnseenChats()
            .then(getSeenChats)
            .then(loadOldMessages)
            .then(() => {
                $("#no-message").hide();
            })
            .catch((err) => {
                if (noMessages)
                    $("#no-message").show()
                else
                    $("#no-message").hide()
                console.log(err);
                $(messageSender).addClass("active");
            });

    });
    //-------------------------------------------------
    $("#chatBox").scroll(function() { //when scroll to top load old chats
        let apiType;
        if ($(this).hasClass("group-message")) {
            apiType = 'group';
        } else {
            apiType = 'single'
        }
        let oldHeight = $('#chatBox')[0].scrollHeight;
        if ($(this)[0].scrollTop == 0) {
            let id;
            let query = {
                authToken: authToken,
                skip: skip //number of chats to skip
            }
            if (apiType == 'group') {
                id = $(".group.active").find(".group-id").text();
                query['groupId'] = id;
            } else {
                id = $(".sender.active").find(".sender-id").text();
                query['senderId'] = id;
            }

            $.get(`${baseUrl}/chat/${apiType}/seen`, query, function(response, status, xhr) {

                if (response.status == 200) {
                    let oldChats = response.data;
                    if (oldChats) {

                        let date = $("#chatBox .date").first().text(); //get topmost date value
                        if (date == "Today")
                            date = formatDate(new Date());
                        $("#chatBox .date").first().remove(); //remove top date

                        for (let i = 0; i < oldChats.length; i++) {

                            let chatDate = formatDate(oldChats[i].createdOn);
                            if (chatDate != date) {

                                let parentDate = $("#date").parent();
                                let newDate = $("#date").clone();
                                $(newDate).prop("hidden", false).prop("id", "");
                                if (date == formatDate(new Date()))
                                    $(newDate).text("Today");
                                else
                                    $(newDate).text(date);
                                $(parentDate).prepend($(newDate));
                                date = chatDate;
                            }

                            if (oldChats[i].senderId == userId) {

                                let parent = $("#message-sent-block").parent();
                                let message = $("#message-sent-block").clone();
                                $(message).find(".message-sent").text(oldChats[i].message);
                                $(message).find(".message-sent-id").val(oldChats[i].chatId);
                                $(message).find(".time").text(changeTo12Hour(oldChats[i].createdOn));
                                if (oldChats[i].seen)
                                    $(message).find(".status-seen").slideDown();
                                else if (oldChats[i].delivered)
                                    $(message).find(".status-delivered").slideDown();
                                else
                                    $(message).find(".status-sent").slideDown();
                                $(message).prop("hidden", false).prop("id", "");
                                $(parent).prepend($(message));

                            } else {

                                let parent = $("#message-recieved-block").parent();
                                let message = $("#message-recieved-block").clone();
                                $(message).find(".message-recieved").text(oldChats[i].message);
                                $(message).find(".message-recieved-id").val(oldChats[i].chatId);
                                $(message).find(".message-name").text(oldChats[i].senderName);
                                $(message).find(".time").text(changeTo12Hour(oldChats[i].createdOn));
                                $(message).prop("hidden", false).prop("id", "");
                                $(parent).prepend($(message));

                            }

                            if (i == oldChats.length - 1) {

                                let parentDate = $("#date").parent();
                                let newDate = $("#date").clone();
                                $(newDate).prop("hidden", false).prop("id", "");
                                if (date == formatDate(new Date()))
                                    $(newDate).text("Today");
                                else
                                    $(newDate).text(date);
                                $(parentDate).prepend($(newDate));

                            }
                        }

                        let newHeight = $('#chatBox')[0].scrollHeight;
                        $('#chatBox').scrollTop(newHeight - oldHeight); //set scroll postion to previous one

                        skip += 10;
                    } else {
                        console.log("No More Old Chats");
                    }

                } else {
                    console.error(`${baseUrl}/chat/${apiType}/seen not working`);
                }

            }, "json");
        }
    });
});
//=======================================================================================================
function setUnseenChatsInChatBox(unseenMessages, id, apiType) {

    let user;
    if (apiType == 'group') {
        user = $(`.group .group-id:contains(${id.groupId})`).parents('.group');
    } else {
        user = $(`.sender .sender-id:contains(${id})`).parents('.sender');
    }
    if (!$(user).hasClass('active')) {
        let parent = $("#unread-messages").parent();
        let element = $("#unread-messages");
        let unreadMessages = $("#unread-messages").clone();
        $(unreadMessages).find("#unread-messages-count").text(unseenMessages.length);
        $(unreadMessages).show();
        $(parent).prepend($(unreadMessages));
        $(element).remove();
    }

    let query = {
        chatIds: unseenMessages,
        authToken: authToken,
        receiverId: userId,
        receiverName: userName,
        modifiedOn: Date.now()
    };

    if (apiType == 'group') {
        query['groupId'] = id.groupId;
        query['senderIds'] = id.senderIds;
    } else {
        query['senderId'] = id;
    }

    socket.emit(`seen-${apiType}`, query);

    setTimeout(function() {
        $("#unread-messages").fadeOut();
        $("#unread-messages-count").text(0);
        if (apiType == 'group') {
            let parent = $(`.group .group-id:contains(${id.groupId})`).parent();
            $(parent).find(".group-unread-messages-count").text(0).hide();
        } else {
            let parent = $(`.sender .sender-id:contains(${id})`).parent();
            $(parent).find(".sender-unread-messages-count").text(0).hide();
        }

        markChatAsSeen(unseenMessages, apiType);
    }, 1000);

}

function markChatAsSeen(unseenMessages, apiType) {
    //Send API
    let object = {
        chatIds: unseenMessages,
        authToken: authToken
    }
    let json = JSON.stringify(object);

    $.ajax({
        type: 'PUT', // Type of request to be send, called as method
        url: `${baseUrl}/chat/${apiType}/seen/mark`, // Url to which the request is send
        data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
        cache: false, // To unable request pages to be cached
        contentType: 'application/json', // The content type used when sending data to the server.
        processData: false, // To send DOMDocument or non processed data file it is set to false
        success: function(response) { // A function to be called if request succeeds
            console.info(response.message);
        },
        error: function(response) { // A function to be called if request failed
            console.error(response);
        }
    });
}

function setUndeliveredMessagesInChatBox(undeliveredMessages, id, apiType) {
    let query = {
        chatIds: undeliveredMessages,
        authToken: authToken,
        receiverId: userId,
        receiverName: userName,
        createdOn: Date.now()
    };

    if (apiType == 'group') {
        query['groupId'] = id.groupId;
        query['senderIds'] = id.senderIds;
    } else {
        query['senderId'] = id;
    }

    socket.emit(`delivered-${apiType}`, query);
    setTimeout(function() {
        markChatAsDelivered(undeliveredMessages, apiType);
    }, 1000);

}

function markChatAsDelivered(undeliveredMessages, apiType) {
    //Send API
    let object = {
        chatIds: undeliveredMessages,
        authToken: authToken
    }

    let json = JSON.stringify(object);

    $.ajax({
        type: 'PUT', // Type of request to be send, called as method
        url: `${baseUrl}/chat/${apiType}/delivered/mark`, // Url to which the request is send
        data: json, // Data sent to server, a set of key/value pairs (i.e. form fields and values)
        cache: false, // To unable request pages to be cached
        contentType: 'application/json', // The content type used when sending data to the server.
        processData: false, // To send DOMDocument or non processed data file it is set to false
        success: function(response) { // A function to be called if request succeeds
            console.info(response.message);
        },
        error: function(response) { // A function to be called if request failed
            console.error(response);
        }
    });
}

//Utility Functions
function changeTo12Hour(time) {
    let date = new Date(time);
    let hours = date.getHours();
    let minutes = date.getMinutes();

    let newformat = hours >= 12 ? 'PM' : 'AM'; // Check whether AM or PM 
    hours = hours % 12;
    hours = hours ? hours : 12; // To display "0" as "12" 
    minutes = minutes < 10 ? '0' + minutes : minutes;

    time = hours + ':' + minutes + ' ' + newformat;
    return time;
}


function change12HourTo24Hour(time) {

    let AM_PM = time.split(' ')[1];
    let hours = time.split(':')[0];
    if (AM_PM == 'PM')
        hours = parseInt(hours) + 12;
    else if (hours < 10)
        hours = '0' + hours;
    let minutes = time.split(':')[1].split(' ')[0];
    minutes = minutes < 10 ? '0' + minutes : minutes;

    time = hours + ':' + minutes + ':00';

    return time;
}

function formatDate(date) { //To dd/mm/yyyyy 
    let d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = '' + d.getFullYear()

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    date = [day, month, year].join('/');

    return date;
}

function unformatDate(date) { //dd/mm/yyyyy to yyyy-mm-dd

    let [day, month, year] = date.split('/');
    day = parseInt(day)
    month = parseInt(month)
    year = parseInt(year)
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;

    return `${year}-${month}-${day}`;
}
