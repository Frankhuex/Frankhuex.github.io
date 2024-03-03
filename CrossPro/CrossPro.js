const F1=document.querySelector(".f1");
const F2=document.querySelector(".f2");
const F3=document.querySelector(".f3");
const S1=document.querySelector(".s1");
const S2=document.querySelector(".s2");
const S3=document.querySelector(".s3");
const submitButton=document.querySelector(".submit");
const resetButton=document.querySelector(".reset");
const ans=document.querySelector(".answer");

submitButton.addEventListener("click",CrossPro);
resetButton.addEventListener("click",reset);

function CrossPro() {
    const f1=Number(F1.value);
    const f2=Number(F2.value);
    const f3=Number(F3.value);
    const s1=Number(S1.value);
    const s2=Number(S2.value);
    const s3=Number(S3.value);
    const r1=f2*s3-f3*s2;
    const r2=f3*s1-f1*s3;
    const r3=f1*s2-f2*s1;  
    ans.textContent="结果："+`${r1}`+" "+`${r2}`+" "+`${r3}`;
}

function reset() {
    F1.value="";
    F2.value="";
    F3.value="";
    S1.value="";
    S2.value="";
    S3.value="";
    ans.textContent="";
}