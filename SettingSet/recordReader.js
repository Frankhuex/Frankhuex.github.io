const jsonPath="./records/";
const txtPath="./records/contents/"

const itemDirector=document.getElementById("itemDirector");
const allList=document.getElementById("allList");
const previousBtn=document.getElementById("previous");
const nextBtn=document.getElementById("next");

let indexNum=[0];
let curIndex=[1];
let jsonSave=[null];
document.addEventListener('DOMContentLoaded', initContent);
previousBtn.addEventListener('click',previousItem);
nextBtn.addEventListener('click',nextItem);
itemDirector.addEventListener('click',swapListener);
allList.addEventListener('click',swapListener);
function swapListener(event) {
    if (event.target.tagName === 'BUTTON') {
        let index = event.target.getAttribute('data-index');
        switchItem(parseInt(index, 10)); 
    }
}


function displayData(data,text) {
    let curItem=data.items[curIndex[0]];
    setHtml("title",data.title);
    setHtml("startingDate","开始日期："+data.starting_date);
    setHtml("authors","作者："+data.authors);
    setHtml("itemIndex",typeTranslate(curItem.type)+curIndex[0]);
    setHtml("itemAuthorAndDate",curItem.author+"写于"+curItem.date);
    setHtml("from","");
    setHtml("to","");
    setHtml("allList","");
    setAllListBtn("allList",indexNum[0]);
    if (curItem.ref_from.length>0) {
        addHtml("from","引用自：");
        addBtn("from",curItem.ref_from);
    }
    if (curItem.cont_from.length>0) {
        addHtml("from","上接：");
        addBtn("from",curItem.cont_from);
    }
    if (curItem.ref_to.length>0) {
        addHtml("to","被以下引用：");
        addBtn("to",curItem.ref_to);
    }
    if (curItem.cont_to.length>0) {
        addHtml("to","下接：");
        addBtn("to",curItem.cont_to);
    }
    
    setHtml("itemText",text);
}

function setHtml(id,innerHTML) {
    const element=document.getElementById(id);
    element.innerHTML=`${innerHTML}`;
}

function addHtml(id,innerHTML) {
    const element=document.getElementById(id);
    element.innerHTML+=`${innerHTML}`;
}

function itemBtn(index) {
    let button=document.createElement('button');
    button.setAttribute('data-index', index);
    //button.addEventListener('click', function() {switchItem(button.getAttribute("data-index"));});
    //console.log(index);
    button.textContent=typeTranslate(jsonSave[0].items[index].type)+String(index);
    return button;
}

function addBtn(id,indexList) {
    let element=document.getElementById(id);
    for (let i=0;i<indexList.length;++i) {
        element.appendChild(itemBtn(indexList[i]));
    } 
}

function setAllListBtn(id,indexNum) {
    let element=document.getElementById(id);
    for (let i=1;i<=indexNum;++i) {
        element.appendChild(itemBtn(i));
    }
}

function initContent() {
    Promise.all([
        fetchJson(jsonPath+'info.json'),
        fetchText(txtPath+'1.txt')
    ]).then(([jsonData, txtData]) => {
        initJson(jsonData);
        displayData(jsonData,txtData);
    });
}

function refreshText() {
    fetchText(txtPath+`${curIndex[0]}.txt`)
    .then(txtData => {
        displayData(jsonSave[0],txtData);
    });
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

function initJson(data) {
    indexNum[0]=data.items.length-1;
    console.log(indexNum[0]);
    for (let i=1;i<=indexNum[0];++i) {
        data.items[i].ref_to=[];
        data.items[i].cont_to=[];
    }
    for (let i=1;i<=indexNum[0];++i) {
        let len=data.items[i].ref_from.length;
        for (var j=0;j<len;++j) {
            let ref=data.items[i].ref_from[j];
            data.items[ref].ref_to.push(i);
        }
        len=data.items[i].cont_from.length;
        for (var j=0;j<len;++j) {
            let cont=data.items[i].cont_from[j];
            data.items[cont].cont_to.push(i);
        }
    }
    jsonSave[0]=data;
}

function previousItem() {
    let i=curIndex[0];
    i=(i+indexNum[0]-2)%indexNum[0]+1;
    curIndex[0]=i;
    refreshText();
}

function nextItem() {
    let i=curIndex[0];
    i=(i+indexNum[0])%indexNum[0]+1;
    curIndex[0]=i;
    refreshText();
}

function switchItem(index) {
    curIndex[0]=index;
    refreshText();
}

function typeTranslate(type) {
    if (type==="setting") return "设定";
    else return "剧情";
}

