let menuButton=document.querySelector(".menu");
menuButton.addEventListener("click",openMenu);

let header=document.querySelector(".header");

let musicButton;
musicButton=document.createElement("button");
musicButton.textContent="音乐";
musicButton.addEventListener("click",);

function openMenu() {
    document.body.append(musicButton);
}
