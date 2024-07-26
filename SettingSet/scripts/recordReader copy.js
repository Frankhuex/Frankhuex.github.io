document.addEventListener('DOMContentLoaded', function() {
    fetch('../records/info.json') // 假设JSON文件名为data.json
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayData(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
});
const container = document.getElementById('itemContent');
var curIndex=1;
function displayData(data) {
    container.innerHTML = `
        <p>${data.title}</p>
    `;
}