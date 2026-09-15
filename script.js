const root = document.documentElement;
const toast = document.querySelector("#toast");
const dialog = document.querySelector("#appDialog");
const storage = {
  profile: "unisync-profile",
  theme: "unisync-theme",
  attendance: "unisync-attendance",
  read: "unisync-read",
  events: "unisync-events",
  questions: "unisync-questions",
};

const subjects = [
  { id: "dsa", name: "Data Structures", attended: 18, total: 22 },
  { id: "dbms", name: "Database Systems", attended: 16, total: 20 },
  { id: "os", name: "Operating Systems", attended: 13, total: 18 },
  { id: "math", name: "Engineering Mathematics", attended: 20, total: 24 },
];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function icons() {
  if (window.lucide) window.lucide.createIcons();
}

function openDialog(title, body, action = "Got it") {
  dialog.querySelector("#dialogEyebrow").textContent = "UNISYNC - CAMPUS CONTEXT";
  dialog.querySelector("#dialogTitle").textContent = title;
  dialog.querySelector("#dialogBody").textContent = body;
  dialog.querySelector("#dialogActions").innerHTML = `<button class="button dark" type="button" data-action="dialog-confirm">${action}</button>`;
  dialog.showModal();
}

function showView(viewName) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active-view"));
  document.querySelector(`#view-${viewName}`)?.classList.add("active-view");
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === viewName));
  const titles = { today: "Good morning, Anushka", ripple: "Your day, with context", hivemind: "Questions worth sharing", truth: "Clarity over chatter", radar: "Your campus is wider", explore: "Find your next thing", calendar: "Your campus calendar", attendance: "Stay above the line", profile: "Your campus identity" };
  document.querySelector("#pageTitle").firstChild.textContent = titles[viewName] || titles.today;
  if (viewName === "attendance") renderAttendance();
  if (viewName === "profile") loadProfile();
  if (viewName === "calendar") renderPersonalEvents();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAttendance() {
  const list = document.querySelector("#attendanceList");
  const saved = JSON.parse(localStorage.getItem(storage.attendance) || "{}");
  list.innerHTML = subjects.map((subject) => {
    const current = saved[subject.id] || subject;
    const percent = Math.round((current.attended / current.total) * 100);
    const safe = percent >= 75;
    return `<article class="attendance-row" data-subject="${subject.id}"><div class="attendance-title"><span class="attendance-dot ${safe ? "safe" : "risk"}"></span><div><h3>${current.name}</h3><span>${current.attended} of ${current.total} classes attended</span></div></div><strong class="attendance-percent ${safe ? "safe-text" : "risk-text"}">${percent}%<small>${safe ? "Safe" : "At risk"}</small></strong><div class="attendance-track"><i style="width:${Math.min(percent, 100)}%"></i></div><div class="attendance-actions"><button class="mini-button" type="button" data-attendance="present" data-id="${subject.id}">Present</button><button class="mini-button" type="button" data-attendance="absent" data-id="${subject.id}">Absent</button></div></article>`;
  }).join("");
  icons();
}

function markAttendance(id, status) {
  const saved = JSON.parse(localStorage.getItem(storage.attendance) || "{}");
  const original = subjects.find((subject) => subject.id === id);
  const current = saved[id] || { ...original };
  current.total += 1;
  if (status === "present") current.attended += 1;
  saved[id] = current;
  localStorage.setItem(storage.attendance, JSON.stringify(saved));
  renderAttendance();
  showToast(`${current.name}: marked ${status}`);
}

function loadProfile() {
  const profile = JSON.parse(localStorage.getItem(storage.profile) || "{}");
  const form = document.querySelector("#profileForm");
  ["name", "email", "role", "department", "semester", "designation", "bio"].forEach((key) => {
    if (profile[key] !== undefined && form.elements[key]) form.elements[key].value = profile[key];
  });
  updateRoleFields(form.elements.role?.value || "student");
  const name = profile.name || "Anushka Sharma";
  const initials = name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  document.querySelector("#profileHeading").textContent = name;
  document.querySelector("#profileSummary").textContent = `${profile.role === "faculty" ? profile.designation || "Faculty" : "Student"} - ${profile.department || "CSE"} - ${profile.semester || "3rd year"}`;
  document.querySelector("#sidebarName").textContent = name;
  document.querySelector("#sidebarRole").textContent = document.querySelector("#profileSummary").textContent;
  document.querySelectorAll("#sidebarAvatar, #profileAvatar, .profile-button").forEach((avatar) => { avatar.textContent = initials; });
}

function updateRoleFields(role) {
  document.querySelector(".semester-field").hidden = role === "faculty";
  document.querySelector(".designation-field").hidden = role !== "faculty";
}

function addCalendar(title, date, time, venue) {
  openDialog("Add to your calendar", `${title}\n${date} - ${time}\n${venue}\n\nA ${time === "All day" ? "ghost block" : "calendar event"} will be created without changing the source notice.`, "Confirm calendar add");
  dialog.dataset.calendarTitle = title;
  dialog.dataset.calendarDate = date;
  dialog.dataset.calendarTime = time;
  dialog.dataset.calendarVenue = venue;
}

function saveEvent(event) {
  const events = JSON.parse(localStorage.getItem(storage.events) || "[]");
  if (!events.some((item) => item.title === event.title && item.date === event.date)) events.push(event);
  localStorage.setItem(storage.events, JSON.stringify(events));
  renderPersonalEvents();
}

function renderPersonalEvents() {
  const list = document.querySelector("#personalEvents");
  if (!list) return;
  const events = JSON.parse(localStorage.getItem(storage.events) || "[]");
  if (!events.length) return;
  list.insertAdjacentHTML("beforeend", events.map((event) => `<div class="personal-event"><time><b>+</b><span>NEW</span></time><div><span class="event-tag">${event.time}</span><h3>${event.title}</h3><p>${event.date} - ${event.venue}</p></div><span class="event-type aqua-pill">Added</span></div>`).join(""));
}

function downloadCalendar() {
  const events = JSON.parse(localStorage.getItem(storage.events) || "[]");
  if (!events.length) {
    showToast("Add an event before downloading your calendar");
    return;
  }
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//UniSync//IGDTUW//EN", ...events.flatMap((event) => ["BEGIN:VEVENT", `SUMMARY:${event.title}`, `DESCRIPTION:${event.date} - ${event.time}`, `LOCATION:${event.venue}`, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = "unisync-campus-calendar.ics";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("UniSync calendar downloaded");
}

function syncCalendar() {
  localStorage.setItem("unisync-calendar-connected", "true");
  showToast("Google Calendar connection saved. Events are ready to sync.");
}

function openSource(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function shareAchievement() {
  const summary = encodeURIComponent("I earned the UniSync Bridge Builder achievement by helping 14 students, earning 86 stars, and making 8 campus connections.");
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${summary}`;
  window.open(url, "_blank", "noopener,noreferrer");
  showToast("LinkedIn share composer opened");
}

function addQuestion() {
  const input = document.querySelector("#questionInput");
  const question = input.value.trim();
  if (!question) { showToast("Write a question first"); return; }
  const questions = JSON.parse(localStorage.getItem(storage.questions) || "[]");
  questions.unshift(question);
  localStorage.setItem(storage.questions, JSON.stringify(questions));
  input.value = "";
  renderQuestions();
  document.querySelector("#questionBadge").textContent = String(3 + questions.length);
  showToast("Question added to Hivemind");
}

function renderQuestions() {
  const list = document.querySelector("#questionList");
  if (!list) return;
  const questions = JSON.parse(localStorage.getItem(storage.questions) || "[]");
  list.querySelectorAll(".new-question").forEach((item) => item.remove());
  list.insertAdjacentHTML("afterbegin", questions.map((question) => `<article class="question-card new-question"><div class="question-top"><span class="pill warning-pill">Pending - just now</span><time>new</time></div><h3>${question.replace(/[<>&]/g, "")}</h3><p>Linked to: <strong>Campus updates</strong></p><button class="mini-button" type="button" data-action="join-question">Join this question</button></article>`).join(""));
}

function updateMetrics() {
  const read = JSON.parse(localStorage.getItem(storage.read) || "[]");
  document.querySelector("#urgentCount").textContent = String(Math.max(0, 2 - read.length));
  document.querySelector("#urgentBadge").textContent = String(Math.max(0, 2 - read.length));
  document.querySelector("#unisyncScore").innerHTML = `${72 + read.length * 5}<small>%</small>`;
  document.querySelector("#scoreTrack").style.width = `${72 + read.length * 5}%`;
}

document.addEventListener("click", (event) => {
  const viewTarget = event.target.closest("[data-view]");
  const actionTarget = event.target.closest("[data-action]");
  const attendanceTarget = event.target.closest("[data-attendance]");
  const exploreTarget = event.target.closest("[data-explore]");

  if (viewTarget) {
    event.preventDefault();
    showView(viewTarget.dataset.view);
    return;
  }
  if (attendanceTarget) {
    markAttendance(attendanceTarget.dataset.id, attendanceTarget.dataset.attendance);
    return;
  }
  if (exploreTarget) {
    document.querySelectorAll(".explore-tab").forEach((tab) => tab.classList.toggle("active", tab === exploreTarget));
    document.querySelectorAll(".opportunity-card").forEach((card) => { card.hidden = exploreTarget.dataset.explore !== "all" && card.dataset.category !== exploreTarget.dataset.explore; });
    return;
  }
  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === "close-dialog") dialog.close();
  if (action === "dialog-confirm") {
    if (dialog.dataset.calendarTitle) {
      saveEvent({ title: dialog.dataset.calendarTitle, date: dialog.dataset.calendarDate, time: dialog.dataset.calendarTime, venue: dialog.dataset.calendarVenue });
      dialog.dataset.calendarTitle = "";
      dialog.close();
      showToast("Event added to your UniSync calendar");
    } else dialog.close();
  }
  if (action === "refresh") { updateMetrics(); showToast("UniSync refreshed with the latest campus updates"); }
  if (action === "scroll-to") document.querySelector(`#${actionTarget.dataset.target}`)?.scrollIntoView({ behavior: "smooth" });
  if (action === "expand") { const copy = actionTarget.closest(".unisync-content").querySelector(".expand-copy"); copy.hidden = !copy.hidden; actionTarget.classList.toggle("selected", !copy.hidden); }
  if (action === "mark-read") {
    const item = actionTarget.closest(".unisync-item, .truth-item");
    const id = item?.dataset.id || item?.querySelector("h3")?.textContent;
    const read = JSON.parse(localStorage.getItem(storage.read) || "[]");
    if (!read.includes(id)) read.push(id);
    localStorage.setItem(storage.read, JSON.stringify(read));
    item?.classList.add("is-read"); updateMetrics(); showToast("Marked as read");
  }
  if (action === "add-calendar") addCalendar(actionTarget.dataset.title, actionTarget.dataset.date, actionTarget.dataset.time, actionTarget.dataset.venue);
  if (action === "sync-calendar") syncCalendar();
  if (action === "download-calendar") downloadCalendar();
  if (action === "open-source") openSource(actionTarget.dataset.url);
  if (action === "share-achievement") shareAchievement();
  if (action === "add-personal-event") addCalendar("Personal schedule block", "Choose a date", "Choose a time", "Your location");
  if (action === "toast") showToast(actionTarget.dataset.message);
  if (action === "broadcast") showToast("Answer broadcast to everyone following this question");
  if (action === "join-question") { actionTarget.textContent = "Joined - 10 students"; actionTarget.classList.add("selected"); showToast("You joined the question"); }
  if (action === "ask-question") {
    addQuestion();
  }
  if (action === "sort") { const list = document.querySelector(".unisync-list"); [...list.children].reverse().forEach((item) => list.appendChild(item)); showToast("Showing newest unisyncs first"); }
});

document.querySelector("#themeToggle")?.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next; localStorage.setItem(storage.theme, next);
  document.querySelector("#themeToggle").innerHTML = `<i data-lucide="${next === "dark" ? "sun" : "moon"}"></i>`;
  icons(); showToast(`${next === "dark" ? "Dark" : "Light"} mode enabled`);
});

document.querySelector("#profileForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  localStorage.setItem(storage.profile, JSON.stringify(data));
  loadProfile(); showToast("Profile saved on this device");
});
document.querySelector("#profileForm [name=role]")?.addEventListener("change", (event) => updateRoleFields(event.target.value));
document.querySelector("#askButton")?.addEventListener("click", () => showView("hivemind"));
document.querySelector("#aiPrompt")?.addEventListener("click", () => showView("hivemind"));
dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

root.dataset.theme = localStorage.getItem(storage.theme) || "light";
updateMetrics();
loadProfile();
renderQuestions();
icons();

