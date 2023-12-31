$('.dynamic-content-custom-items')
.hover(
    function () {
    $('.element-options', this).transition({
        animation  : 'swing left',
        duration   : 100,
    });
    },
    
);
$('.ui.dropdown').dropdown();



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

    document.getElementById('backButton').addEventListener('click', () => {
        contentAside.classList.toggle('hide');
        newGroupBlock.classList.add('hide');
        editGroupBlock.classList.add('hide');
    });
});



// =============== FUNCTION THAT AUTOMATICALLY SCROLL PAGE TO THE BOTTOM =========== //
const scrollToBottom = () =>{
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


const handleItemClick = (element)=>{
    const tempTemplate = document.getElementById('tempTemplate')
    const username = document.getElementById('hiddenName').value    
    tempTemplate.classList.add('hide')


    var roomId = element.getAttribute('data-roomId');
    console.log('Item clicked with roomId:', roomId);
    const messages = document.getElementById('messages');
    
    initializeSocketConnection(username, roomId);

    // fetch room messages
    fetchRoomMessages(roomId)

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
    const socket = io.connect('http://127.0.0.1:5008/');

    socket.on('connect', () => {
        socket.emit('join_room', {
            username: username,
            room: roomId
        });
    });

    window.onbeforeunload = () => {
        socket.emit('leave_room', {
            username: username,
            room: roomId
        });
    };

    socket.on('receive_message', (data) => {
        createMessage(data.username, data.message, data.created_at);
        scrollToBottom()
    });

    socket.on('join_room_announcement', (data) => {
        console.log(data);

        if (data.username !== username) {
            message = `<b>${data.username}</b> has joined the room`;
            createMessage(data.username, message, data.created_at);
        }
    });

    socket.on('leave_room_announcement', function (data) {
        console.log(data);
        message = `<b>${data.username}</b> has left the room`;
        createMessage(data.username, message, data.created_at);
    });

    const createMessage = (profileName, msg, created_at) => {
        appendMessages(msg, profileName, created_at)
    };

// ============================ SEND BUTTON TO SEND MESSAGE TO BACKEND ======================= //
    const messageInput = document.getElementById('message');
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();

            const messageValue = messageInput.value.trim();

            if (messageValue !== '') {
                socket.emit('send_message', {
                    'username': username,
                    'message': messageValue,
                    'room': roomId
                });
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
            // Handle success (if needed)
            console.log('POST request successful:', response);
            document.getElementById('roomTitle').textContent = response.room.name
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


