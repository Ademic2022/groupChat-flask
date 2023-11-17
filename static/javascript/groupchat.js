const groupOptionButton = document.getElementById('groupOptionButton')
const optionContent = document.getElementById('optionContent')
const editRoom = document.getElementById('editRoom')
const loadPreviousMessages = document.getElementById('loadPreviousMessages')

groupOptionButton.addEventListener('click', (e)=>{
    e.preventDefault();
    optionContent.classList.toggle('hidden')
})
editRoom.addEventListener('click', (e)=>{
    const roomId = document.getElementById('roomId')
    e.preventDefault();
    window.location.href = `/rooms/edit/${roomId.value}`
})
const prependMessages = (message, username, created_at) =>{
    const profileName = document.getElementById('hiddenName').value
    const isCurrentUser = profileName === username
    const textColor = isCurrentUser ? 'green' : 'red';
    const content = `
        <div class="message-content">
            <span>
                <strong style="color: ${textColor};">${username}</strong>: ${message}
            </span>
            <span class="muted" style="color: ${textColor};">
                ${created_at}
            </span>
        </div>
    `;
    // insertAdjacentHTML with 'afterbegin' to prepend the content
    messages.insertAdjacentHTML('afterbegin', content);
}

let page = 0
loadPreviousMessages.addEventListener('click', (e)=>{
    page += 1
    const roomId = document.getElementById('roomId')
    const url = `/rooms/${roomId.value}/messages?page=${page}`
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