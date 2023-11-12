// $(document).ready(()=>{
    var socket = io()
    const messages = document.getElementById('messages')

    const createMessage = (profileName, msg)=>{
        const content = `
        <div class="message-content">
            <span>
                <strong>${profileName}</strong>: ${msg}
            </span>
            <span class="muted">
                ${new Date().toLocaleString()}
            </span>
        </div>
        `
        messages.innerHTML += content
    }
    socket.on('message', (data)=>{
        createMessage(data.profileName, data.message)
    })
    
    const sendMessage = ()=>{
        const message = document.getElementById('message')
        if (message.value == '') return;
        socket.emit('message', {data: message.value})
        message.value = ''
    }
// })