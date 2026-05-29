// === Global State ===



let currentUser = null;



let isAdmin = false;



let allIssues = [];



let filteredIssues = [];



let currentPage = 1;



const PAGE_SIZE = 20;



let currentEditId = null;



let parsedPasteData = null;



let parsedHeaders = [];



let currentProjectId = "1";



let projects = [];







document.addEventListener("DOMContentLoaded", () => {



    document.getElementById("isAdmin").addEventListener("change", (e) => {



        document.getElementById("adminPasswordGroup").style.display = e.target.checked ? "block" : "none";



    });



    document.getElementById("loginForm").addEventListener("submit", handleLogin);



    document.getElementById("engineerName").addEventListener("keypress", (e) => {



        if (e.key === "Enter") handleLogin(e);



    });



    let searchTimer;



    document.getElementById("searchInput").addEventListener("input", () => {



        clearTimeout(searchTimer);



        searchTimer = setTimeout(filterIssues, 300);



    });



    var pa = document.getElementById("pasteArea");



    if (pa) { pa.addEventListener("paste", () => { setTimeout(parsePastedData, 100); }); }



});







// ======== ??????§Õ ========



var C = {};



C["A"] = "????????";



C["B"] = "???";



C["C"] = "????";



C["D"] = "????????";



C["E"] = "?§Ù??????";



C["F"] = "????";



C["G"] = "????????";



C["H"] = "????????";



C["I"] = "???????";



C["J"] = "???Delay";



C["K"] = "Delay????";



C["L"] = "Issue??";



C["M"] = "?????";



C["N"] = "????????????";



C["O"] = "RD???????????";



C["P"] = "?????????";



C["Q"] = "??????Delay";



C["R"] = "??????";



C["S"] = "DQA??????";



C["T"] = "DQA???";



C["U"] = "??????????????";



C["V"] = "???????";







// ======== ??? ========



async function handleLogin(e) {



    e.preventDefault();



    var name = document.getElementById("engineerName").value.trim();



    var adminChecked = document.getElementById("isAdmin").checked;



    var adminPassword = document.getElementById("adminPassword").value.trim();



    var errorEl = document.getElementById("loginError");



    if (!name) { showLoginError("??????????"); return; }



    if (adminChecked) {



        if (!adminPassword) { showLoginError("??????????????"); return; }



        try {



            var resp = await fetch("/api/verify-admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: adminPassword }) });



            var result = await resp.json();



            if (!result.success) { showLoginError(result.message || "????????????"); return; }



            isAdmin = true;



        } catch (err) { showLoginError("?????????????"); return; }



    }



    currentUser = name;



    errorEl.style.display = "none";



    document.getElementById("loginPage").style.display = "none";



    document.getElementById("mainPage").style.display = "block";



    var badge = document.getElementById("userBadge");



    badge.textContent = name;



    if (isAdmin) { badge.classList.add("admin-badge"); badge.textContent = name + " (?????)"; }



    if (isAdmin) {



        document.getElementById("adminToolbar").style.display = "flex";



        document.getElementById("statsRow").style.display = "grid";



        await loadProjects();



        await loadIssues();



        await loadStats();



    } else {



        await loadProjects();



        await loadIssuesAllProjects();



    }



}







function showLoginError(msg) {



    var el = document.getElementById("loginError");



    el.textContent = msg;



    el.style.display = "block";



}







function logout() {



    currentUser = null; isAdmin = false; allIssues = []; filteredIssues = [];



    currentPage = 1; currentEditId = null; projects = []; currentProjectId = "1";



    document.getElementById("loginPage").style.display = "flex";



    document.getElementById("mainPage").style.display = "none";



    document.getElementById("adminToolbar").style.display = "none";



    document.getElementById("statsRow").style.display = "none";



    document.getElementById("engineerName").value = "";



    document.getElementById("adminPassword").value = "";



    document.getElementById("isAdmin").checked = false;



    document.getElementById("adminPasswordGroup").style.display = "none";



    document.getElementById("loginError").style.display = "none";



}







// ======== ??????? ========



async function loadProjects() {



    try {



        var resp = await fetch("/api/projects");



        var result = await resp.json();



        if (result.success) {



            projects = result.data;



            renderProjectSelect();



            // ??????????????§Ò??§µ??§Ý????????



            var found = projects.find(function(p) { return String(p.id) === String(currentProjectId); });



            if (!found && projects.length > 0) {



                currentProjectId = String(projects[0].id);



                renderProjectSelect();



            }



        }



    } catch (err) { console.error("????????§Ò????", err); }



}







function renderProjectSelect() {



    var sel = document.getElementById("projectSelect");



    if (!sel) return;



    sel.innerHTML = projects.map(function(p) {



        var selected = (String(p.id) === String(currentProjectId)) ? " selected" : "";



        return '<option value="' + p.id + '"' + selected + '>' + escHtml(p.name) + '</option>';



    }).join("");



}







async function switchProject() {



    var sel = document.getElementById("projectSelect");



    currentProjectId = sel.value;



    allIssues = [];



    filteredIssues = [];



    currentPage = 1;



    await loadIssues();



    if (isAdmin) loadStats();



}







async function showNewProjectDialog() {



    var name = prompt("????????????????");



    if (!name || !name.trim()) return;



    try {



        var resp = await fetch("/api/projects", {



            method: "POST",



            headers: { "Content-Type": "application/json" },



            body: JSON.stringify({ name: name.trim() })



        });



        var result = await resp.json();



        if (result.success) {



            showToast(result.message, "success");



            await loadProjects();



            var sel = document.getElementById("projectSelect");



            sel.value = result.id;



            switchProject();



        } else {



            showToast(result.message || "???????", "error");



        }



    } catch (err) { showToast("???????", "error"); }



}







async function clearCurrentProject() {



    var sel = document.getElementById("projectSelect");



    var projectName = sel.options[sel.selectedIndex].text;



    if (!confirm("???¹×????????????" + projectName + "?????????????????????????")) return;



    if (!confirm("?????????????????" + projectName + "???????? Issue ??????????????")) return;



    try {



        var resp = await fetch("/api/projects/" + currentProjectId + "/clear", { method: "DELETE" });



        var result = await resp.json();



        if (result.success) {



            showToast(result.message, "success");



            allIssues = [];



            filteredIssues = [];



            currentPage = 1;



            filterIssues();



            if (isAdmin) loadStats();



        } else {



            showToast(result.message || "???????", "error");



        }



    } catch (err) { showToast("???????", "error"); }



}







// ======== ??????? ========



async function loadIssuesAllProjects() {
    try {
        var params = new URLSearchParams();
        params.set("engineer", currentUser);
        var resp = await fetch("/api/issues?" + params.toString());
        var result = await resp.json();
        if (result.success) {
            allIssues = result.data;
            filteredIssues = [...allIssues];
            document.getElementById("statMyIssues").textContent = result.count;
            filterIssues();
        } else { showToast(result.message || "???????", "error"); }
    } catch (err) { showToast("????????????????", "error"); }
}

async function loadIssues() {



    try {



        var params = new URLSearchParams();



        if (isAdmin) { params.set("admin", "true"); }



        else { params.set("engineer", currentUser); }



        if (isAdmin) { params.set("project_id", currentProjectId); }



        var resp = await fetch("/api/issues?" + params.toString());



        var result = await resp.json();



        if (result.success) {



            allIssues = result.data;



            filteredIssues = [...allIssues];



            document.getElementById("statMyIssues").textContent = result.count;



            filterIssues();



        } else { showToast(result.message || "???????", "error"); }



    } catch (err) { showToast("????????????????", "error"); }



}







async function loadStats() {



    try {



        var resp = await fetch("/api/stats?project_id=" + currentProjectId);



        var result = await resp.json();



        if (result.success) {



            document.getElementById("statTotal").textContent = result.total;



            document.getElementById("statEngineers").textContent = result.engineers;



        }



    } catch (err) {}



}







function filterIssues() {



    var searchText = document.getElementById("searchInput").value.toLowerCase().trim();



    var statusFilter = document.getElementById("statusFilter").value;



    filteredIssues = allIssues.filter(function(issue) {



        if (statusFilter) { if ((issue[C.U] || "") !== statusFilter) return false; }



        if (searchText) {



            var vals = Object.values(issue).join(" ").toLowerCase();



            if (!vals.includes(searchText)) return false;



        }



        return true;



    });



    currentPage = 1; renderTable();



}







function renderTable() {



    var tbody = document.getElementById("issueTableBody");



    var totalPages = Math.ceil(filteredIssues.length / PAGE_SIZE) || 1;



    var start = (currentPage - 1) * PAGE_SIZE;



    var pageData = filteredIssues.slice(start, start + PAGE_SIZE);



    document.getElementById("filterCount").textContent = "?? " + filteredIssues.length + " ?????";



    if (pageData.length === 0) {



        tbody.innerHTML = "<tr><td colspan=\"16\" class=\"empty-state\"><p>????????????</p></td></tr>";



        document.getElementById("pagination").style.display = "none";



        return;



    }



    var html = "";



    pageData.forEach(function(issue) {



        var status = issue[C.U] || "";



        var sc = status ? "status-" + status : "status-\u672A\u586B\u5199";



        var sd = status || "\u672A\u586B\u5199";



        var delay = issue[C.J] || "";



        var dc = (delay.indexOf("\u662F") >= 0 || delay.toLowerCase().indexOf("yes") >= 0) ? "delay-yes" : "";



        var sev = issue[C.M] || "";



        var svc = (sev.indexOf("\u9AD8") >= 0 || sev.indexOf("\u4E25\u91CD") >= 0 || sev.indexOf("Critical") >= 0) ? "severity-high" : "";



        var ut = issue[C.V] || "";



        var dt = issue[C.N] || "";



        var descShort = dt.substring(0, 40) + (dt.length > 40 ? "..." : "");



        var it = issue[C.A] || "";



        html += "<tr>" +



            "<td>" + (issue.id || "") + "</td>" +



            "<td title=\"" + escHtml(it) + "\">" + escHtml(it.substring(0, 20)) + (it.length > 20 ? "..." : "") + "</td>" +



            "<td>" + escHtml(issue[C.B] || "") + "</td>" +



            "<td>" + escHtml(issue[C.C] || "") + "</td>" +



            "<td>" + escHtml(issue[C.D] || "") + "</td>" +



            "<td>" + escHtml(issue[C.E] || "") + "</td>" +



            "<td>" + escHtml(issue[C.F] || "") + "</td>" +



            "<td>" + escHtml(issue[C.G] || "") + "</td>" +



            "<td>" + escHtml(issue[C.H] || "") + "</td>" +



            "<td class=\"" + dc + "\">" + escHtml(delay) + "</td>" +



            "<td>" + escHtml(issue[C.L] || "") + "</td>" +



            "<td class=\"" + svc + "\">" + escHtml(sev) + "</td>" +



            "<td class=\"desc-cell\" data-fulltext=\"" + escHtml(dt) + "\"><span class=\"desc-text\">" + escHtml(descShort) + "</span></td>" +



            "<td><span class=\"status-badge " + sc + "\">" + sd + "</span></td>" +



            "<td>" + escHtml(ut) + "</td>" +



            "<td><button class=\"btn btn-primary btn-xs\" onclick=\"openEditModal(" + issue.id + ")\">??</button></td>" +



            "</tr>";



    });



    tbody.innerHTML = html;



    var pag = document.getElementById("pagination");



    if (filteredIssues.length > PAGE_SIZE) {



        pag.style.display = "flex";



        document.getElementById("pageInfo").textContent = "?? " + currentPage + " ? / ?? " + totalPages + " ?";



        document.getElementById("prevBtn").disabled = currentPage <= 1;



        document.getElementById("nextBtn").disabled = currentPage >= totalPages;



    } else { pag.style.display = "none"; }



}







function prevPage() { if (currentPage > 1) { currentPage--; renderTable(); } }



function nextPage() { var totalPages = Math.ceil(filteredIssues.length / PAGE_SIZE) || 1; if (currentPage < totalPages) { currentPage++; renderTable(); } }







function openEditModal(issueId) {



    var issue = allIssues.find(function(i) { return i.id === issueId; });



    if (!issue) return;



    currentEditId = issueId;



    document.getElementById("editIssueId").textContent = issueId;



    document.getElementById("editItem").textContent = issue[C.A] || "-";



    document.getElementById("editDesc").textContent = issue[C.N] || "-";



    document.getElementById("editSeverity").textContent = issue[C.M] || "-";



    document.getElementById("editStatus").value = issue[C.U] || "";



    var now = new Date();



    document.getElementById("editTime").value = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-" + String(now.getDate()).padStart(2,"0");



    document.getElementById("editModal").style.display = "flex";



}







function closeModal() { document.getElementById("editModal").style.display = "none"; currentEditId = null; }







async function saveEdit() {



    var status = document.getElementById("editStatus").value;



    var tv = document.getElementById("editTime").value;



    if (!status && !tv) { showToast("????????§Õ???", "error"); return; }



    var ut = "";



    if (tv) { ut = tv; }



    try {



        var resp = await fetch("/api/issues/" + currentEditId, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: status, update_time: ut }) });



        var result = await resp.json();



        if (result.success) { showToast("??????", "success"); closeModal(); await loadIssues(); }



        else { showToast(result.message || "???????", "error"); }



    } catch (err) { showToast("?????????????", "error"); }



}







// ======== ?????? ========



async function handleUpload(input) {



    var file = input.files[0];



    if (!file) return;



    document.getElementById("uploadModal").style.display = "flex";



    var formData = new FormData();



    formData.append("file", file);



    formData.append("project_id", currentProjectId);



    try {



        var resp = await fetch("/api/upload", { method: "POST", body: formData });



        var result = await resp.json();



        document.getElementById("uploadModal").style.display = "none";



        input.value = "";



        if (result.success) { showToast(result.message, "success"); await loadIssues(); await loadStats(); }



        else { showToast(result.message || "???????", "error"); }



    } catch (err) { document.getElementById("uploadModal").style.display = "none"; input.value = ""; showToast("???????", "error"); }



}







async function exportExcel() {



    var pw = document.getElementById("adminPassword").value.trim();



    if (!pw) { showToast("????????????????", "error"); return; }



    try {



        var resp = await fetch("/api/export?password=" + encodeURIComponent(pw) + "&project_id=" + currentProjectId);



        var ct = resp.headers.get("content-type") || "";



        if (resp.status === 200 && ct.indexOf("spreadsheet") >= 0) {



            var blob = await resp.blob();



            var url = window.URL.createObjectURL(blob);



            var a = document.createElement("a");



            a.href = url;



            a.download = "Issue????_" + new Date().toISOString().slice(0,10) + ".xlsx";



            document.body.appendChild(a); a.click(); document.body.removeChild(a);



            window.URL.revokeObjectURL(url);



            showToast("???????", "success");



        } else { var r2 = await resp.json(); showToast(r2.message || "???????", "error"); }



    } catch (err) { showToast("???????", "error"); }



}







// ======== ?????? ========



var COL_MAP = {



    "\u6D4B\u8BD5\u4E8B\u9879": "\u6D4B\u8BD5\u4E8B\u9879",



    "\u9636\u6BB5": "\u9636\u6BB5",



    "\u5206\u7C7B": "\u5206\u7C7B",



    "\u6D4B\u8BD5\u5DE5\u7A0B\u5E08": "\u6D4B\u8BD5\u5DE5\u7A0B\u5E08",



    "\u7814\u53D1\u5DE5\u7A0B\u5E08": "\u7814\u53D1\u5DE5\u7A0B\u5E08",



    "\u90E8\u95E8": "\u90E8\u95E8",



    "\u53D1\u751F\u65E5\u671F": "\u53D1\u751F\u65E5\u671F",



    "\u8981\u6C42\u7ED3\u6848\u65E5\u671F": "\u8981\u6C42\u7ED3\u6848\u65E5\u671F",



    "\u7EDF\u8BA1\u65E5\u671F": "\u7EDF\u8BA1\u65E5\u671F",



    "\u662F\u5426delay": "\u662F\u5426Delay",



    "delay\u5929\u6570": "Delay\u5929\u6570",



    "issue\u72B6\u6001": "Issue\u72B6\u6001",



    "\u4E25\u91CD\u5EA6": "\u4E25\u91CD\u5EA6",



    "\u95EE\u9898\u70B9\u8BE6\u7EC6\u63CF\u8FF0": "\u95EE\u9898\u70B9\u8BE6\u7EC6\u63CF\u8FF0",



    "rd\u662F\u5426\u63D0\u4F9B\u6539\u5584\u63AA\u65BD": "RD\u662F\u5426\u63D0\u4F9B\u6539\u5584\u63AA\u65BD",



    "\u8981\u6C42\u56DE\u590D\u65E5\u671F": "\u8981\u6C42\u56DE\u590D\u65E5\u671F",



    "\u56DE\u590D\u662F\u5426delay": "\u56DE\u590D\u662F\u5426Delay",



    "\u6539\u5584\u63AA\u65BD": "\u6539\u5584\u63AA\u65BD",



    "dqa\u662F\u5426\u786E\u8BA4": "DQA\u662F\u5426\u786E\u8BA4",



    "dqa\u786E\u8BA4": "DQA\u786E\u8BA4",



    "\u95EE\u9898\u70B9\u5F53\u524D\u5904\u7406\u8FDB\u5EA6": "\u95EE\u9898\u70B9\u5F53\u524D\u5904\u7406\u8FDB\u5EA6",



    "\u66F4\u65B0\u65F6\u95F4": "\u66F4\u65B0\u65F6\u95F4"



};







function normHdr(h) {



    var k = h.replace(/\s+/g, "").toLowerCase().replace(/[\uFF1A:]/g, "");



    return COL_MAP[k] || null;



}







function openPasteModal() {



    var pa = document.getElementById("pasteArea");



    if (pa) pa.value = "";



    document.getElementById("pastePreviewWrapper").style.display = "none";



    document.getElementById("pasteSaveBtn").disabled = true;



    document.getElementById("pasteParseMsg").textContent = "";



    document.getElementById("pasteParseMsg").className = "paste-msg";



    parsedPasteData = null;



    document.getElementById("pasteModal").style.display = "flex";



}







function closePasteModal() {



    document.getElementById("pasteModal").style.display = "none";



    parsedPasteData = null;



}







function parsePastedData() {



    var text = document.getElementById("pasteArea").value.trim();



    var msgEl = document.getElementById("pasteParseMsg");



    var wrapper = document.getElementById("pastePreviewWrapper");



    var saveBtn = document.getElementById("pasteSaveBtn");



    if (!text) {



        msgEl.textContent = "??????????????????";



        msgEl.className = "paste-msg error";



        wrapper.style.display = "none"; saveBtn.disabled = true; return;



    }



    var lines = text.split("\n").filter(function(l) { return l.trim(); });



    if (lines.length < 2) {



        msgEl.textContent = "???????????§Ü????????";



        msgEl.className = "paste-msg error";



        wrapper.style.display = "none"; saveBtn.disabled = true; return;



    }



    var rawHdrs = lines[0].split("\t").map(function(h) { return h.trim(); });



    if (rawHdrs.length < 2) {



        msgEl.textContent = "¦Ä????????????????Excel????????";



        msgEl.className = "paste-msg error";



        wrapper.style.display = "none"; saveBtn.disabled = true; return;



    }



    var mapping = rawHdrs.map(function(h) { return normHdr(h); });



    var vc = mapping.filter(function(m) { return m !== null; }).length;



    if (vc === 0) {



        msgEl.textContent = "¦Ä?????§¹???????????Excel?????????????";



        msgEl.className = "paste-msg error";



        wrapper.style.display = "none"; saveBtn.disabled = true; return;



    }



    var dataRows = [];



    for (var i = 1; i < lines.length; i++) {



        var cells = lines[i].split("\t");



        var row = {}; var hasData = false;



        for (var j = 0; j < rawHdrs.length; j++) {



            var mc = mapping[j];



            if (mc) { var val = (cells[j] || "").trim(); row[mc] = val; if (val) hasData = true; }



        }



        if (hasData) dataRows.push(row);



    }



    if (dataRows.length === 0) {



        msgEl.textContent = "??§á????????§¹??????";



        msgEl.className = "paste-msg error";



        wrapper.style.display = "none"; saveBtn.disabled = true; return;



    }



    parsedPasteData = dataRows;



    parsedHeaders = rawHdrs;



    document.getElementById("pasteRowCount").textContent = dataRows.length;



    document.getElementById("pasteColCount").textContent = vc;



    msgEl.textContent = "?????????" + dataRows.length + " ???????" + vc + " ???????";



    msgEl.className = "paste-msg success";







    var thead = document.getElementById("pastePreviewHead");



    thead.innerHTML = "<tr>" + rawHdrs.map(function(h, i) {



        var m = mapping[i];



        return "<th>" + (m ? "<span style=\"color:#10b981;font-weight:600\">" + esc(h) + "</span>" : "<span class=\"unmapped-col\">" + esc(h) + "</span>") + "</th>";



    }).join("") + "</tr>";







    var tbody = document.getElementById("pastePreviewBody");



    var preview = dataRows.slice(0, 50);



    var html = preview.map(function(row, ridx) {



        return "<tr>" + rawHdrs.map(function(h, i) {



            var m = mapping[i];



            var val = m ? (row[m] || "") : ((lines[ridx + 1] || "").split("\t")[i] || "").trim();



            return "<td>" + esc(val) + "</td>";



        }).join("") + "</tr>";



    }).join("");



    if (dataRows.length > 50) { html += "<tr><td colspan=\"" + rawHdrs.length + "\" style=\"text-align:center;color:#6b7280;padding:10px;\">... ???? " + (dataRows.length - 50) + " ??????¦Ä???</td></tr>"; }



    tbody.innerHTML = html;



    wrapper.style.display = "block";



    saveBtn.disabled = false;



}







async function savePastedData() {



    if (!parsedPasteData || parsedPasteData.length === 0) { showToast("?????????????", "error"); return; }



    var append = document.getElementById("pasteAppend").checked;



    var btn = document.getElementById("pasteSaveBtn");



    btn.disabled = true; btn.textContent = "??????...";



    try {



        var resp = await fetch("/api/issues/bulk-save", {



            method: "POST",



            headers: { "Content-Type": "application/json" },



            body: JSON.stringify({ rows: parsedPasteData, append: append, project_id: currentProjectId })



        });



        var result = await resp.json();



        if (result.success) {



            showToast(result.message, "success");



            closePasteModal();



            await loadIssues();



            if (isAdmin) await loadStats();



        } else { showToast(result.message || "???????", "error"); btn.disabled = false; }



    } catch (err) { showToast("???????", "error"); btn.disabled = false; }



    btn.textContent = "??????";



}







async function clearAllData() {



    if (!confirm("???¹×????????????????????????????")) return;



    try {



        var resp = await fetch("/api/projects/" + currentProjectId + "/clear", { method: "DELETE" });



        var result = await resp.json();



        if (result.success) { showToast("?????????", "success"); closePasteModal(); await loadIssues(); if (isAdmin) await loadStats(); }



        else { showToast(result.message || "???????", "error"); }



    } catch (err) { showToast("???????", "error"); }



}







// ======== ??????? ========



function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }



function escHtml(s) { if (!s) return ""; var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }







function showToast(message, type) {



    type = type || "info";



    var toast = document.getElementById("toast");



    toast.textContent = message;



    toast.className = "toast toast-" + type;



    toast.style.display = "block";



    clearTimeout(toast._timeout);



    toast._timeout = setTimeout(function() { toast.style.display = "none"; }, 3000);



}







// ======== ??????????? ========



var tooltipEl = null;



function getTooltipEl() {



    if (!tooltipEl) {



        tooltipEl = document.createElement("div");



        tooltipEl.className = "desc-tooltip";



        tooltipEl.style.display = "none";



        document.body.appendChild(tooltipEl);



    }



    return tooltipEl;



}



function showTooltip(e) {



    var cell = e.target.closest(".desc-cell");



    if (!cell) return;



    var fulltext = cell.getAttribute("data-fulltext");



    if (!fulltext) return;



    var tip = getTooltipEl();



    tip.textContent = fulltext;



    tip.style.display = "block";



    positionTooltip(tip, cell);



}



function hideTooltip(e) {



    var cell = e.target.closest(".desc-cell");



    if (!cell) return;



    var tip = getTooltipEl();



    tip.style.display = "none";



}



function positionTooltip(tip, cell) {



    var rect = cell.getBoundingClientRect();



    var tipWidth = tip.offsetWidth;



    var tipHeight = tip.offsetHeight;



    var viewportWidth = window.innerWidth;



    var viewportHeight = window.innerHeight;



    // ?????????????¡¤?

    var left = rect.left;



    var top = rect.bottom + 8;



    // ???????????????????

    if (left + tipWidth > viewportWidth - 10) {



        left = viewportWidth - tipWidth - 10;



    }



    if (left < 10) { left = 10; }



    // ????¡¤????????????????

    if (top + tipHeight > viewportHeight - 10) {



        top = rect.top - tipHeight - 8;



        // ???????????

        tip.classList.add("tooltip-above");



    } else {



        tip.classList.remove("tooltip-above");



    }



    tip.style.left = left + "px";



    tip.style.top = top + "px";



}



document.addEventListener("mouseover", function(e) {



    if (e.target.closest(".desc-cell")) {



        showTooltip(e);



    }



});



document.addEventListener("mouseout", function(e) {



    if (e.target.closest(".desc-cell")) {



        hideTooltip(e);



    }



});



// ????????? tooltip

var tableWrapper = document.querySelector(".table-wrapper");
if (tableWrapper) {
    tableWrapper.addEventListener("scroll", function() {



    var tip = getTooltipEl();



        tip.style.display = "none";
    });
}

document.addEventListener("click", function(e) {


    if (e.target.id === "editModal") closeModal();



    if (e.target.id === "uploadModal") document.getElementById("uploadModal").style.display = "none";



    if (e.target.id === "pasteModal") closePasteModal();



});



document.addEventListener("keydown", function(e) {



    if (e.key === "Escape") {



        closeModal();



        document.getElementById("uploadModal").style.display = "none";



        closePasteModal();



    }



});



