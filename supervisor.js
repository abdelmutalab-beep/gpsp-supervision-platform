const $ = (s) => document.querySelector(s);
let students = [];

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[m]);
}

async function loadDashboard() {
  const status = $("#api-status");

  try {
    status.textContent = "جارٍ تحميل البيانات";
    status.className = "badge blue";

    const payload = await GPSP_API.dashboard();
    students = Array.isArray(payload.students) ? payload.students : [];

    renderStudents();

    status.textContent = "متصل";
    status.className = "badge green";
  } catch (err) {
    console.error(err);

    status.textContent = "تعذر تحميل البيانات";
    status.className = "badge orange";

    $("#students-body").innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          ${esc(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderStudents() {
  $("#student-count").textContent = students.length + " طالب";

  const review = students.filter((s) =>
    String(s.status || "").includes("مراجعة")
  ).length;

  const revision = students.filter((s) =>
    String(s.status || "").includes("تعديل")
  ).length;

  const avg = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + (Number(s.progress) || 0), 0)
        / students.length
      )
    : 0;

  $("#m-total").textContent = students.length;
  $("#m-review").textContent = review;
  $("#m-revision").textContent = revision;
  $("#m-progress").textContent = avg + "%";

  $("#students-body").innerHTML = students.length
    ? students.map((s, i) => `
        <tr>
          <td><strong>${esc(s.name)}</strong></td>
          <td>${esc(s.studentId)}</td>
          <td>${esc(s.title || "—")}</td>
          <td><span class="badge blue">${esc(s.stage || "Proposal")}</span></td>
          <td>${Number(s.progress) || 0}%</td>
          <td>${esc(s.status || "Active")}</td>
          <td>
            <button class="btn soft" onclick="openStudent(${i})">
              فتح
            </button>
          </td>
        </tr>
      `).join("")
    : `
      <tr>
        <td colspan="7" class="empty">لا توجد بيانات طلاب.</td>
      </tr>
    `;
}

async function openStudent(index) {
  const student = students[index];
  if (!student) return;

  $("#workspace").style.display = "block";
  $("#ws-name").textContent = student.name;
  $("#ws-title").textContent = student.title || "—";
  $("#ws-stage").textContent = student.stage || "Proposal";

  try {
    const workspace = await GPSP_API.studentWorkspace(student.studentId);

    const submissions = Array.isArray(workspace.submissions)
      ? workspace.submissions
      : [];

    const reviews = Array.isArray(workspace.reviews)
      ? workspace.reviews
      : [];

    $("#ws-submissions").innerHTML = submissions.length
      ? submissions.map(v => `
          <div class="timeline-item">
            <div>${esc(v.Part || v.part || "")}</div>
            <div>${esc(v.FileName || v.fileName || "—")}</div>
          </div>
        `).join("")
      : `<div class="empty">لا توجد تسليمات.</div>`;

    $("#ws-reviews").innerHTML = reviews.length
      ? reviews.map(r => `
          <div class="timeline-item">
            <div>${esc(r.Part || r.part || "عام")}</div>
            <div>${esc(r.Feedback || r.feedback || "—")}</div>
          </div>
        `).join("")
      : `<div class="empty">لا توجد ملاحظات.</div>`;

  } catch (err) {
    console.error(err);
  }
}

function afterLogin(profile) {
  if (!profile) return;

  if (profile.role !== "Supervisor") {
    $("#api-status").textContent = "الحساب ليس حساب مشرف";
    $("#api-status").className = "badge orange";
    return;
  }

  $("#api-status").textContent = "تم تسجيل الدخول";
  $("#api-status").className = "badge green";
  $("#refresh-btn").disabled = false;

  loadDashboard();
}

function initGoogleLogin() {
  const button = document.getElementById("google-signin");

  if (!button) {
    console.error("google-signin element not found");
    return;
  }

  if (!window.GPSP_AUTH) {
    console.error("GPSP_AUTH not loaded");
    return;
  }

  if (
    !window.google ||
    !google.accounts ||
    !google.accounts.id
  ) {
    setTimeout(initGoogleLogin, 300);
    return;
  }

  GPSP_AUTH.init("google-signin", afterLogin);
}

document.addEventListener("DOMContentLoaded", () => {
  $("#refresh-btn").addEventListener("click", loadDashboard);
  initGoogleLogin();
});
