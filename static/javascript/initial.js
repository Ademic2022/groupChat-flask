let socketConnectionInitialized = false;
let activeRoomId = null;

const showGenOptions = (genOptionsContent, clickedElementId) => {
    const id = `#${genOptionsContent}`;
    const chatOptionsContent = $(id);
    const clickedElement = `#${clickedElementId}`;

    // Toggle the class on the clicked element
    $(clickedElement).toggleClass('chatOptions');

    // Toggle the visibility of chatOptionsContent using jQuery transition
    chatOptionsContent.transition('slide down');

    // Add a click event listener to the document to close the container when clicking outside
    const closeOnClickOutside = (event) => {
        const container = $(clickedElement);

        // Check if the clicked element is not inside the container
        if (!container.is(event.target) && container.has(event.target).length === 0) {
            // Close the container
            $(clickedElement).removeClass('chatOptions');
            chatOptionsContent.transition('slide down');

            // Remove the event listener after the container is closed
            document.removeEventListener('click', closeOnClickOutside);
        }
    };

    // Add the click event listener to the document
    document.addEventListener('click', closeOnClickOutside);
};

document.addEventListener('DOMContentLoaded', function () {
    const contentAside = document.getElementById('contentAside');
    const newGroupBlock = document.getElementById('newGroupBlock');
    const editGroupBlock = document.getElementById('editGroupBlock');

    const toggleElements = (dataAttributeValue) => {
        contentAside.classList.toggle('hide');

        if (dataAttributeValue === 'newGroup') {
            newGroupBlock.classList.remove('hide');
            editGroupBlock.classList.add('hide');
        } else if (dataAttributeValue === 'editGroup') {
            newGroupBlock.classList.add('hide');
            editGroupBlock.classList.remove('hide');
        }
    };

    document.querySelectorAll('.addNewGroupButton').forEach((e) => {
        e.addEventListener('click', (event) => {
            const dataAttributeValue = e.getAttribute('data-button_name');
            toggleElements(dataAttributeValue);
        });
    });

    const backButton = document.querySelectorAll('#backButton')
    backButton.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const dataAttribute = e.currentTarget.getAttribute('data-icon')
            if (dataAttribute === 'arrow'){
                contentAside.classList.toggle('hide');
                newGroupBlock.classList.add('hide');
                editGroupBlock.classList.add('hide');
            }else if(dataAttribute === 'times'){
                const hideContent = document.querySelectorAll('.hideContent')
                // every time the back button is clicked, hide all element with class hideContent
                hideContent.forEach((e)=>{
                    e.classList.add('hide')
                })
            }
        })
    })

    const chatRoomOptionBtnLogic = ()=>{
        const chatRoomOptionBtn = document.querySelectorAll('.chat-room-option-btn')
        chatRoomOptionBtn.forEach((button)=>{
            button.addEventListener('click', (e)=>{
                e.preventDefault()
                const dataAttributeVal = e.currentTarget.getAttribute('data-btn_type');
                const availableAttributes = ['editRoom','roomInfo','clearChats','deleteChats','reportUser','block']
                const rightBar = document.getElementById('rightBar')
                if (dataAttributeVal === availableAttributes[0]){
                    const editRoomContent = document.getElementById('editRoomContent')
                    rightBar.classList.toggle('hide')
                    editRoomContent.classList.remove('hide')
                }
                else if (dataAttributeVal === availableAttributes[1]){
                    const roomInfo = document.getElementById('roomInfo')
                    roomInfo.classList.remove('hide')
                    rightBar.classList.toggle('hide')
                }
            })
        })
    }
    chatRoomOptionBtnLogic()
});



// =============== FUNCTION THAT AUTOMATICALLY SCROLL PAGE TO THE BOTTOM =========== //
const scrollToBottom = () =>{
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// =============== SUPER FUNCTION =========== //

const handleItemClick = (element)=>{
    const tempTemplate = document.getElementById('tempTemplate')
    const username = document.getElementById('hiddenName').value    
    tempTemplate.classList.add('hide')
    var roomId = element.getAttribute('data-roomId');

    if (roomId !== activeRoomId) {
        console.log('Item clicked with roomId:', roomId);

        // Initialize socket connection
        initializeSocketConnection(username, roomId);

        // Set the active room and the flag to indicate that the connection is now initialized
        activeRoomId = roomId;
        socketConnectionInitialized = true;

        // Fetch room messages
        fetchRoomMessages(roomId);
    }
}

// ========================= PREPEND MESSAGE FUNCTION ============================ //

const prependMessages = (message, username, created_at) =>{
    const position = 'afterbegin'
    const profileName = document.getElementById('hiddenName').value
    const isCurrentUser = profileName === username
    if (isCurrentUser){
        senderMessagesTemplate(username, message, created_at, position)
    }
    else{
        receiverMessagesTemplate(username, message, created_at, position)
    }
    
}

// ========================= APPEND MESSAGE FUNCTION ============================ //


const appendMessages = (message, username, created_at) =>{
    const position = 'beforeend'
    const profileName = document.getElementById('hiddenName').value
    const isCurrentUser = profileName === username
    if (isCurrentUser){
        senderMessagesTemplate(username, message, created_at, position)
    }
    else{
        receiverMessagesTemplate(username, message, created_at, position)
    }
    
}


// ========================= SOCKET ENGINE FUNCTION ============================ //

function initializeSocketConnection(username, roomId) {
    const socket = io.connect();

    // Wrap the socket connection in a Promise
    const connectPromise = new Promise((resolve) => {
        socket.on('connect', () => {
            resolve();
        });
    });

    // Emit the 'join_room' event after the connection is established
    connectPromise.then(() => {
        socket.emit('join_room', {
            username: username,
            room: roomId
        });
    });

    // Handle 'leave_room' on window unload
    window.onbeforeunload = () => {
        // Wrap the 'leave_room' event in a Promise
        const leaveRoomPromise = new Promise((resolve) => {
            socket.emit('leave_room', {
                username: username,
                room: roomId
            }, () => {
                resolve();
            });
        });

        // Prevent the page from unloading until 'leave_room' is acknowledged
        return leaveRoomPromise;
    };

    // Handle 'receive_message'
    socket.on('receive_message', (data) => {
        createMessage(data.username, data.message, data.created_at);
        scrollToBottom();
    });

    // Handle 'join_room_announcement'
    socket.on('join_room_announcement', (data) => {
        console.log(data);

        if (data.username !== username) {
            const message = `<b>${data.username}</b> has joined the room`;
            createMessage(data.username, message, data.created_at);
        }
    });

    // Handle 'leave_room_announcement'
    socket.on('leave_room_announcement', (data) => {
        console.log(data);
        const message = `<b>${data.username}</b> has left the room`;
        
        // Wrap the 'createMessage' call in a Promise
        const createMessagePromise = new Promise((resolve) => {
            createMessage(data.username, message, data.created_at);
            resolve();
        });

        // Wait for 'createMessage' to complete
        createMessagePromise.then(() => {
            // Additional async operations if needed
        });
    });

    // Handle message input
    const messageInput = document.getElementById('message');
    messageInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();

            const messageValue = messageInput.value.trim();

            if (messageValue !== '') {
                // Wrap the 'send_message' event in a Promise
                const sendMessagePromise = new Promise((resolve) => {
                    socket.emit('send_message', {
                        'username': username,
                        'message': messageValue,
                        'room': roomId
                    }, () => {
                        resolve();
                    });
                });

                // Wait for the 'send_message' event to be acknowledged
                await sendMessagePromise;

                messageInput.value = '';
                messageInput.focus();
            }
        }
    });
}

// =============== FUNCTION THAT FETCHES ROOM MESSAGES ==================== //
const fetchRoomMessages = (roomId) => {
    $.ajax({
        type: 'POST',
        url: '/groupchat/' + roomId,
        success: function(response) {
            const roomName = response.room.name
            document.getElementById('roomTitle').textContent = roomName
            const chatRoomOptionBtn = document.querySelectorAll('.chat-room-option-btn')
            chatRoomOptionBtn.forEach((button)=>{
                button.addEventListener('click', (e)=>{
                    e.preventDefault()
                    const dataAttributeVal = e.currentTarget.getAttribute('data-btn_type');
                    const availableAttributes = ['roomInfo','editRoom','clearChats','deleteChats','reportUser','block']
                    if (dataAttributeVal === availableAttributes[0]){
                        RoomInformation(response.room_members, roomName)     
                    }
                    else if(dataAttributeVal === availableAttributes[1]){
                        const rooMembers = fetchRoomMembers(response.room_members)
                        document.getElementById('newGroupName').value = roomName
                        document.getElementById('newGroupMembers').value = rooMembers


                        // RoomInformation(response.room_members, roomName)
                        const members_check = response.room_members
                        let isCurrentUser = false

                        members_check.forEach((admin)=>{
                            if (admin.is_room_admin){
                                const profileName = document.getElementById('hiddenName').value
                                isCurrentUser = profileName === admin.added_by      
                            }
                        })

                        if(isCurrentUser){
                            const editRoomBtn = document.getElementById('editRoomBtn')
                            editRoomBtn.addEventListener('click', (e)=> {
                                e.preventDefault()
                                const newRoomName = document.getElementById('newGroupName').value;
                                const newRoomMembers = document.getElementById('newGroupMembers').value;

                                if(newRoomName !== '' && newRoomMembers !== ''){
                                    const formValues = {
                                        newGroupNameValue: newRoomName,
                                        newGroupMembersValue: newRoomMembers
                                    }
                                    console.log(formValues);
                                    // send post request to the backend
                                    saveEditRoomChanges(formValues, roomId)
                                }
                            })
                        }
                        else{
                            const readonly = document.querySelectorAll('.readonly');
                            const editRoomBtn = document.getElementById('editRoomBtn')
                            // disable the submit button
                            editRoomBtn.disabled = true;
                            readonly.forEach((e)=>{
                                e.readOnly = true
                            })

                            console.log('Only the group admin is authorized to edit this room');
                        }
                    }
                })
            })
            messages.innerHTML =''
            if (Array.isArray(response.messages)) {
                response.messages.forEach(message => {
                    appendMessages(message.text, message.sender, message.created_at)
                });
                scrollToBottom()
                fetchPreviousMessageWhenUserScrolltoTop(roomId);
            } else {
                console.error('Unexpected response format:', response);
            }
        },
        error: function(error) {
            // Handle error (if needed)
            console.error('Error in POST request:', error);
        }
    });
}

// =============== FUNCTION THAT FETCH GROUP INFORMATIONS ==================== //

function RoomInformation(members, roomName) {
    const roomMembers = document.getElementById('roomMembers');
    document.getElementById('roomName').textContent = roomName
    let content = ''; // Initialize an empty string to accumulate content

    members.forEach(member => {
        if (member._id) {
            // Clean up _id string and replace 'ObjectId'
            const cleanedIdString = member._id
                .replace(/'/g, '"')
                .replace(/ObjectId\(/g, '')
                .replace(/\)/g, '');

            try {
                const idObject = JSON.parse(cleanedIdString);
                const username = idObject.username;

                // Append to the content string
                content += `
                    <div class="dynamic-content-custom-items">
                        <img class="profile-image" src="../static/img/profile.png">
                        <div class="title-wrapper">
                            <div class="list-title">
                                <h3>${username}</h3>
                            </div>
                            <div class="subtitle">
                                <p>Lorem ipsum dolor sit, amet consectetur adipisici.</p>
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        } else {
            console.error('_id is undefined for a member:', member);
        }
    });

    // Set the accumulated content to the roomMembers element
    roomMembers.innerHTML = content;
}


// =============== MESSAGE SENDER TEMPLATE FOR APPENDING NEW MESSAGE ==================== //

const senderMessagesTemplate = (username, message, created_at, position) =>{
    const content = `
        <div class="message-block">
            <div class="message-block-sidebar">
                <p>${username[0]}</p>
            </div>
            <div class="message-block-content">
                <p class="message"></p>
                <p class="message-block-content-name" style="color: green;">~ 
                    <i>${username}</i>
                </p>
                <p class="text-message">${message}</p>
                <span class="senders-time"><i>${created_at}</i></span>
            </div>
        </div>
    `;
    // insertAdjacentHTML with 'afterbegin' to prepend the content
    messages.insertAdjacentHTML(position, content);

}

// =============== MESSAGE RECEIVER TEMPLATE FOR APPENDING NEW MESSAGE ==================== //

const receiverMessagesTemplate = (username, message, created_at, position) => {    
    const content = `
        <div class="message-block receiver-block">
            <div class="message-block-content" style="border-radius: 10px 0 10px 10px;">
                <p class="message-receiver"></p>
                <p class="message-block-content-name-receiver" style="color: red;">~ 
                    <i>${username}</i>
                </p>
                <p class="text-message"> ${message}</p>
                <span class="receivers-time"><i>${created_at}</i></span>
            </div>
            <div class="message-block-sidebar">
                <p>${username[0]}</p>
            </div>
        </div>
    `;
    // insertAdjacentHTML with 'afterbegin' to prepend the content
    messages.insertAdjacentHTML(position, content);
}

// =============== FUNCTION THAT FETCHES PREVIOUS MESSAGE WHEN USER SCROLL TO THE TOP OF CHAT PAGE ==================== //

const fetchPreviousMessageWhenUserScrolltoTop = (roomId) => {
    const messagesContainer = document.getElementById('messages');
    
    let page = 0
    let currentScrollPosition = 0;
    messagesContainer.addEventListener('scroll', () => {
        if (messagesContainer.scrollTop === 0) {
            currentScrollPosition = messagesContainer.scrollHeight - messagesContainer.scrollTop;
            page += 1
            const url = `/rooms/${roomId}/messages?page=${page}`
            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response =>{
                response.json().then(messages => {
                    
                    messages.reverse().forEach(message => prependMessages(message.text, message.sender, message.created_at))

                    // Restore the scroll position
                    messagesContainer.scrollTop = messagesContainer.scrollHeight - currentScrollPosition;
                })
            })
        }
    });
};

// =============== FUNCTION THAT HANDLES EDIT ROOM ==================== //
const fetchRoomMembers = (members)=>{
    let room_members = []; // Initialize an empty string to accumulate content
    members.forEach(member => {  
        if (member._id) {
            // Clean up _id string and replace 'ObjectId'
            const cleanedIdString = member._id
                .replace(/'/g, '"')
                .replace(/ObjectId\(/g, '')
                .replace(/\)/g, '');

            try {
                const idObject = JSON.parse(cleanedIdString);
                const username = idObject.username;
                room_members.push(username)

            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        } else {
            console.error('_id is undefined for a member:', member);
        }
    });
    return room_members.join(',')
        
}

/*
   THIS FUNCTION SENDS REQUEST TO THE SERVER TO EDIT THE ROOM
   IF THE REQUEST IS SUCCESSFUL, THE PAGE IS RELOADED AUTHOMATICALLY
*/
const saveEditRoomChanges = async (formData, roomId) => {
    try {
        const url = `/rooms/edit/${roomId}`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Check if the response is JSON
        if (response.headers.get('content-type')?.includes('application/json')) {
            const responseData = await response.json();
            console.log('Success:', responseData);
        } else {
            const responseText = await response.text();
            console.log('Non-JSON Response:', responseText);
        }

        // Reload the page after a successful response
        window.location.reload();
        
        // Toggle the 'hide' class for the element with ID 'rightBar'
        document.getElementById('rightBar').classList.toggle('hide');

    } catch (error) {
        console.error('Error:', error);
    }
};


// ================================== FUNCTION THAT CREATES NEW GROUP ============================ //
const createNewGroup = () => {
    // Get form data
    let groupName = $('#groupName').val();
    let groupMembers = $('#groupMembers').val();

    if (groupName !== '' && groupMembers !== ''){
        const formData = {
            groupName: groupName,
            groupMembers: groupMembers
        };


        // Send the POST request
        $.ajax({
            type: 'POST',
            url: '/',
            data: formData,
            success: function (response) {
                // console.log('POST request successful:', response);
                window.location.reload();
            },
            error: function (error) {
                console.error('Error in POST request:', error);
            }
        });

        
        contentAside.classList.toggle('hide')

        $('#groupName').val('');
        $('#groupMembers').val('');
    }
    
};

// =============== THIS FUNCTION LOGS USER OUT ==================== //

const logOut = () => {
        // Send the POST request
    $.ajax({
        type: 'GET',
        url: '/logout',
        success: function (response) {
            window.location.reload();
        },
        error: function (error) {
            console.error('Error in POST request:', error);
        }
    });
};

const createRoom = document.getElementById('createRoom')
const logOutBtn = document.getElementById('logOut')

createRoom.addEventListener('click', createNewGroup)
logOutBtn.addEventListener('click', logOut)
