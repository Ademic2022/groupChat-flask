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


