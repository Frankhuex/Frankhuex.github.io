const indexNum=17;
var curIndex=[1];
document.addEventListener('DOMContentLoaded', refreshContent);
document.getElementById("previous").addEventListener('click',previousItem);
document.getElementById("next").addEventListener('click',nextItem);



function refreshContent() {
    Promise.all([
        fetchJson('../records/info.json'),
        fetchText(`../records/contents/${curIndex}.txt`)
    ]).then(([jsonData, txtData]) => {
        displayData(jsonData,txtData);
        //displayText(txtData);
    });
}

function previousItem() {
    var i=curIndex[0];
    i=((i-1)+16)%indexNum+1;
    curIndex[0]=i;
    refreshContent();
}

function nextItem() {
    var i=curIndex[0];
    i=((i+1)+16)%indexNum+1;
    curIndex[0]=i;
    refreshContent();
}


function fetchJson(url) {
    return fetch(url)
        .then(response => response.json())
        .catch(error => console.error('Error fetching JSON:', error));
}

function fetchText(url) {
    return fetch(url)
        .then(response => response.text())
        .catch(error => console.error('Error fetching TXT:', error));
}

function displayData(data,text) {
    const jsonDataContainer = document.getElementById('itemContent');
    jsonDataContainer.innerHTML = `
        <p>${data.title}</p>
        <p>${curIndex}</p>
        <pre>${text}</pre>
    `;
    // 将JSON数据存储在变量中
    window.jsonData = data; // 注意：window对象用于全局变量，但实际开发中应避免使用全局变量
}

function displayText(text) {
    const txtDataContainer = document.getElementById('txtDataContainer');
    txtDataContainer.textContent = text;
    // 将文本数据存储在变量中
    window.txtData = text;
}

// 后续操作示例
function someOperationWithJsonData() {
    // 假设我们想检查JSON数据中的年龄是否大于25
    if (window.jsonData.age > 25) {
        console.log('The person is older than 25.');
    }
}

// 调用后续操作函数
//someOperationWithJsonData();
