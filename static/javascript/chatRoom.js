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

const textarea = document.querySelector('textarea');

textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        const inputValue = textarea.value.trim(); 

        if (inputValue !== '') {
            console.log('Submitted:', inputValue);

            textarea.value = '';
            textarea.style.height = '40px'; // Reset the height
        }
    } else {
        const currentHeight = textarea.clientHeight;
        textarea.style.height = '40px';
        const scheight = e.target.scrollHeight;

        if (scheight > currentHeight) {
            textarea.style.height = `${scheight}px`;
        }
    }
});

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














const handleItemClick = (element)=>{
    const tempTemplate = document.getElementById('tempTemplate')
    const username = document.getElementById('hiddenName').value
    tempTemplate.classList.add('hide')


    var roomId = element.getAttribute('data-roomId');
    console.log('Item clicked with roomId:', roomId);
    const messages = document.getElementById('messages');
    
    initializeSocketConnection(username, roomId);
    $.ajax({
        type: 'POST',
        url: '/groupchat/' + roomId,
        success: function(response) {
            // Handle success (if needed)
            console.log('POST request successful:', response);
            document.getElementById('roomTitle').textContent = response.room.name
            messages.innerHTML =''
            if (Array.isArray(response.messages)) {
                response.messages.reverse().forEach(message => {
                    appendMessages(message.text, message.sender, message.created_at)
                });
            } else {
                console.error('Unexpected response format:', response);
            }
        },
        error: function(error) {
            // Handle error (if needed)
            console.error('Error in POST request:', error);
        }
    });



    let page = 0
    const loadPreviousMessages = document.getElementById('loadPreviousMessages')
    loadPreviousMessages.addEventListener('click', (e)=>{
        page += 1
        // const roomId = document.getElementById('roomId')
        var roomId = element.getAttribute('data-roomId');
        console.log(roomId);
        const url = `/rooms/${roomId}/messages?page=${page}`
        e.preventDefault();
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response =>{
            response.json().then(messages => {
                
                messages.reverse().forEach(message => prependMessages(message.text, message.sender, message.created_at))
            })
        })
    })

}



const prependMessages = (message, username, created_at) =>{
    const profileName = document.getElementById('hiddenName').value
    const isCurrentUser = profileName === username
    if (isCurrentUser){
        const content = `
            <div class="message-block">
                <div class="message-block-sidebar">
                   <p>A</p>
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
        messages.insertAdjacentHTML('afterbegin', content);
    }
    else{
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
                    <p>G</p>
                </div>
            </div>
        `;
        // insertAdjacentHTML with 'afterbegin' to prepend the content
        messages.insertAdjacentHTML('afterbegin', content);
    }
    
}

const appendMessages = (message, username, created_at) =>{
    const profileName = document.getElementById('hiddenName').value
    const isCurrentUser = profileName === username
    if (isCurrentUser){
        const content = `
            <div class="message-block">
                <div class="message-block-sidebar">
                   <p>A</p>
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
        messages.insertAdjacentHTML('afterbegin', content);
    }
    else{
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
                    <p>G</p>
                </div>
            </div>
        `;
        // insertAdjacentHTML with 'afterbegin' to prepend the content
        messages.insertAdjacentHTML('beforeend', content);
    }
    
}







const createMessage = (profileName, msg, created_at) => {
    const isCurrentUser = profileName === username
    const textColor = isCurrentUser ? 'green' : 'red';
    console.log('createMessage called:', profileName, msg, isCurrentUser);
    
    const content = `
    <div class="message-content">
    <span>
    <strong style="color: ${textColor};">${profileName}</strong>: ${msg}
    </span>
    <span class="muted" style="color: ${textColor};">
    ${created_at}
    </span>
    </div>
    `;
    messages.innerHTML += content;
};



const sendMessage = () => {
    const message = document.getElementById('message');
    console.log('message sent');
    messageInput = message.value.trim()
    if (messageInput === '') return;
    socket.emit('send_message', { 'username': username, 'message': messageInput, 'room': roomId});
    message.value = '';
    message.focus();
};

// // ================================ SOCKET CONNECTION =========================== //
// const socket = io.connect('http://127.0.0.1:5008/')

// socket.on('connect', () => {
//     socket.emit('join_room', {
//         username: username,
//         room: roomId
//     });
// });


// window.onbeforeunload = () => {
//     socket.emit('leave_room', {
//         username: username,
//         room: roomId
//     })
// };

// socket.on('receive_message', (data) => {
//     createMessage(data.username, data.message, data.created_at);
// });

// socket.on('join_room_announcement', (data) => {
//     console.log(data);

//     if (data.username !== username) {
//         message = `<b>${data.username}</b> has joined the room`
//         createMessage(data.username, message, data.created_at);
//     }
// });

// socket.on('leave_room_announcement', function (data) {
//     console.log(data);
//     message = `<b>${data.username}</b> has left the room`
//     createMessage(data.username, message, data.created_at);   
// });

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
}



