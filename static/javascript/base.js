const socket = io.connect('http://127.0.0.1:5008/')
const messages = document.getElementById('messages');
const username = document.getElementById('hiddenName').value
const roomId = document.getElementById('roomId').value


const createMessage = (profileName, msg) => {
    const isCurrentUser = profileName === username
    const textColor = isCurrentUser ? 'green' : 'red';
    console.log('createMessage called:', profileName, msg, isCurrentUser);

    const content = `
        <div class="message-content">
            <span>
                <strong style="color: ${textColor};">${profileName}</strong>: ${msg}
            </span>
            <span class="muted" style="color: ${textColor};">
                ${new Date().toLocaleString()}
            </span>
        </div>
    `;
    messages.innerHTML += content;
};

socket.on('connect', () => {
    socket.emit('join_room', {
        username: username,
        room: roomId
    });
});

const sendMessage = () => {
    const message = document.getElementById('message');
    messageInput = message.value.trim()
    if (messageInput === '') return;
    socket.emit('send_message', { 'username': username, 'message': messageInput, 'room': roomId});
    message.value = '';
    message.focus();
};

window.onbeforeunload = () => {
    socket.emit('leave_room', {
        username: username,
        room: roomId
    })
};

socket.on('receive_message', (data) => {
    createMessage(data.username, data.message);
});

socket.on('join_room_announcement', (data) => {
    console.log(data);
    if (data.username !== username) {
        message = `<b>${data.username}</b> has joined the room`
        createMessage(data.username, message);
    }
});

socket.on('leave_room_announcement', function (data) {
    console.log(data);
    message = `<b>${data.username}</b> has left the room`
    createMessage(data.username, message);

    
});