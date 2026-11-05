function search() {
    const form = document.getElementById("search_form");
    const site = new URL(form.getAttribute("data-site"), window.location.href);
    const query = "site:" + site.host + site.pathname + " " +
        document.getElementById("search_value").value;
    window.open(form.getAttribute("action_e") + encodeURIComponent(query));
    return false;
}

let display = false;
function displayAll() {
	let elements = document.querySelectorAll(".catalogue .hidden");
	if (!display) {
		for (let elem of elements) {
			elem.style.display = "block";
			display = true;
		}
	} else {
		for (let elem of elements) {
			elem.style.display = "none";
			display = false;
		}
	}
}
