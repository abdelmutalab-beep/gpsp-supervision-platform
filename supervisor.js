const $ = (s) => document.querySelector(s);
let students = [];

function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[m]
  );
}

async function loadDashboard() {
  const status = $("#api-status");

  try {
    status.textContent = "جارٍ تحميل البيانات";
    status.className = "badge blue";

    const payload = await GPSP_API.dashboard();

    students = Array.isArray(payload.students)
      ? payload.students
      : [];

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
          تعذر تحميل بيانات الطلاب: ${esc(err.message)}
        </td>
      </tr>
    `;
  }
}

function renderStudents() {
  $("#student-count").textContent =
    students.length + " طالب";

  const review = students.filter((s) =>
    String(s.status || "").includes("مراجعة")
  ).length;

  const revision = students.filter((s) =>
    String(s.status || "").includes("تعديل")
  ).length;

  const avg = students.length
    ? Math.round(
        students.reduce(
          (sum, s) =>
            sum + (Number(s.progress) || 0),
          0
        ) / students.length
      )
    : 0;

  $("#m-total").textContent = students.length;
  $("#m-review").textContent = review;
  $("#m-revision").textContent = revision;
  $("#m-progress").textContent = avg + "%";

  if (!students.length) {
    $("#students-body").innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          لا توجد بيانات طلاب.
        </td>
      </tr>
    `;
    return;
  }

  $("#students-body").innerHTML = students
    .map(
      (s, i) => `
        <tr>
          <td>
            <strong>${esc(s.name)}</strong>
          </td>

          <td>
            ${esc(s.studentId)}
          </td>

          <td>
            ${esc(s.title || "—")}
          </td>

          <td>
            <span class="badge blue">
              ${esc(s.stage || "Proposal")}
            </span>
          </td>

          <td>
            <div style="
              display:flex;
              align-items:center;
              gap:8px;
            ">
              <div
                class="progress"
                style="width:110px"
              >
                <span
                  style="
                    width:${Number(s.progress) || 0}%
                  "
                ></span>
              </div>

              ${Number(s.progress) || 0}%
            </div>
          </td>

          <td>
            ${esc(s.status || "Active")}
          </td>

          <td>
            <button
              class="btn soft"
              onclick="openStudent(${i})"
            >
              فتح
            </button>
          </td>
        </tr>
      `
    )
    .join("");
}

async function openStudent(index) {
  const student = students[index];

  if (!student) return;

  $("#workspace").style.display = "block";

  $("#ws-name").textContent = student.name;
  $("#ws-title").textContent =
    student.title || "—";

  $("#ws-stage").textContent =
    student.stage || "Proposal";

  $("#ws-submissions").innerHTML = `
    <div class="empty">
      جارٍ تحميل التسليمات...
    </div>
  `;

  $("#ws-reviews").innerHTML = `
    <div class="empty">
      جارٍ تحميل الملاحظات...
    </div>
  `;

  try {
    const workspace =
      await GPSP_API.studentWorkspace(
        student.studentId
      );

    const submissions =
      Array.isArray(workspace.submissions)
        ? workspace.submissions
        : [];

    const reviews =
      Array.isArray(workspace.reviews)
        ? workspace.reviews
        : [];

    $("#ws-submissions").innerHTML =
      submissions.length
        ? submissions
            .slice()
            .reverse()
            .map(
              (v) => `
                <div class="timeline-item">
                  <div>
                    V${esc(v.Version || v.version || "")}
                  </div>

                  <div>
                    <strong>
                      ${esc(v.FileName || v.fileName || "—")}
                    </strong>

                    <div
                      style="
                        color:var(--muted);
                        font-size:13px;
                      "
                    >
                      ${esc(v.Part || v.part || "")}
                      •
                      ${esc(v.SubmittedAt || v.submittedAt || "")}
                    </div>
                  </div>

                  <span class="badge gray">
                    ${esc(v.Decision || v.decision || "بانتظار المراجعة")}
                  </span>
                </div>
              `
            )
            .join("")
        : `
            <div class="empty">
              لا توجد تسليمات.
            </div>
          `;

    $("#ws-reviews").innerHTML =
      reviews.length
        ? reviews
            .slice()
            .reverse()
            .map(
              (r) => `
                <div class="timeline-item">
                  <div>
                    ${esc(r.Part || r.part || "عام")}
                  </div>

                  <div>
                    ${esc(
                      r.Feedback ||
                        r.feedback ||
                        r.MajorNotes ||
                        r.majorNotes ||
                        r.MinorNotes ||
                        r.minorNotes ||
                        "—"
                    )}
                  </div>

                  <span class="badge blue">
                    ${esc(r.Score || r.score || "—")}
                  </span>
                </div>
              `
            )
            .join("")
        : `
            <div class="empty">
              لا توجد ملاحظات.
            </div>
          `;
  } catch (err) {
    console.error(err);

    $("#ws-submissions").innerHTML = `
      <div class="empty">
        تعذر تحميل مساحة الطالب.
      </div>
    `;

    $("#ws-reviews").innerHTML = "";
  }

  $("#workspace").scrollIntoView({
    behavior: "smooth",
  });
}

function onSupervisorSignedIn(profile) {
  if (!profile) return;

  if (profile.role !== "Supervisor") {
    $("#api-status").textContent =
      "الحساب ليس حساب مشرف";

    $("#api-status").className =
      "badge orange";

    alert(
      "هذا الحساب غير مسجل كمشرف في المنصة."
    );

    return;
  }

  $("#api-status").textContent =
    "تم تسجيل الدخول";

  $("#api-status").className =
    "badge green";

  $("#refresh-btn").disabled = false;

  loadDashboard();
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    $("#refresh-btn").addEventListener(
      "click",
      loadDashboard
    );

    const waitForGoogle = setInterval(() => {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        clearInterval(waitForGoogle);

        GPSP_AUTH.init(
          "google-signin",
          onSupervisorSignedIn
        );
      }
    }, 200);
  }
);
