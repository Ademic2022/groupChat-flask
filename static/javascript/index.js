const optionButton = document.getElementById('optionButton')
const createNewRoom = document.getElementById('createNewRoom')
const optionContent = document.getElementById('optionContent')
const editRoom = document.getElementById('editRoom')


optionButton.addEventListener('click', (e)=>{
    e.preventDefault();
    optionContent.classList.toggle('hidden')
})
createNewRoom.addEventListener('click', (e)=>{
    e.preventDefault();
    const createRoom = document.getElementById('createRoom')
    optionContent.classList.toggle('hidden')
    createRoom.classList.toggle('hidden')
})
editRoom.addEventListener('click', (e)=>{
    e.preventDefault();
    window.location.href = '/rooms/edit'
})