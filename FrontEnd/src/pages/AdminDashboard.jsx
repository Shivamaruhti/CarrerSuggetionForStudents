import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./Admin.css";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const sections = [
  { id: "overview", label: "Dashboard", icon: "▦" },
  { id: "users", label: "All Users", icon: "♙" },
  { id: "courses", label: "All Courses", icon: "▤" },
  { id: "after10th", label: "After 10th", icon: "01" },
  { id: "intermediate", label: "Intermediate", icon: "02" },
  { id: "graduation", label: "Graduation", icon: "03" },
  { id: "pg", label: "Post Graduation", icon: "04" },
  { id: "jobs", label: "All Jobs", icon: "▣" },
  { id: "profile", label: "Admin Profile", icon: "♧" },
];

const educationTitles = {
  after10th: "After 10th Education",
  intermediate: "Intermediate Education",
  graduation: "Graduation Education",
  pg: "Post-Graduation Education",
};
const nextLevels = ["Intermediate", "Polytechnic", "ITI", "Paramedical", "Others"];
const previousLevels = {
  graduation: ["Intermediate", "Diploma", "ITI", "Paramedical", "Others"],
  pg: ["BE/B.Tech", "Medicine", "Allied Health Sciences", "Paramedical", "Degree", "Teaching", "Others"],
};
const durations = [
  "Less than 1 year", "1 year", "2 years", "3 years", "4 years",
  "5 years", "6 years", "Above 7 years",
];
const entranceOptions = ["Entrance Test", "Direct Joining"];
const emptyEducation = {
  previousStandard: "", previousBranch: "", nextStandard: "", duration: "", branch: "",
  entranceTypes: [], entranceTestName: "", description: "", eligibility: "",
  institution: "", fees: "", careerOptions: "",
};
const emptyJob = {
  jobTitle: "", company: "", location: "", qualification: "", jobType: "",
  salary: "", description: "", applyUrl: "",
};
const emptyUser = { fullName: "", phone: "", password: "", status: "ACTIVE" };

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("adminToken");
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("adminToken");
    window.location.assign("/admin-login");
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.detail || data.title || `Request failed (${response.status})`);
  return data;
}

function recordList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  throw new Error("The server returned an invalid records response.");
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("adminToken");
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formType, setFormType] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [education, setEducation] = useState(emptyEducation);
  const [job, setJob] = useState(emptyJob);
  const [user, setUser] = useState(emptyUser);
  const [importRows, setImportRows] = useState([]);
  const [importReport, setImportReport] = useState(null);
  const [importFileErrors, setImportFileErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef(null);

  const refreshData = useCallback(async () => {
    const [userData, courseData, jobData] = await Promise.all([
      apiRequest("/admin/users"),
      apiRequest("/admin/courses"),
      apiRequest("/admin/jobs"),
    ]);
    setUsers(recordList(userData));
    setCourses(recordList(courseData));
    setJobs(recordList(jobData));
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        await refreshData();
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [token, refreshData]);

  const filteredUsers = useMemo(() => filterRows(users, search), [users, search]);
  const filteredCourses = useMemo(() => filterRows(courses, search), [courses, search]);
  const filteredJobs = useMemo(() => filterRows(jobs, search), [jobs, search]);
  const title = sections.find((section) => section.id === active)?.label || "Dashboard";

  if (!token) return <Navigate to="/admin-login" replace />;

  function chooseSection(id) {
    setActive(id);
    setSearch("");
    setError("");
    setNotice("");
    setFormType("");
    setEditingId(null);
    setImportRows([]);
    setImportReport(null);
    setImportFileErrors([]);
    setSidebarOpen(false);
  }

  async function handleCsvFile(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setError("");
    setNotice("");
    setImportRows([]);
    setImportReport(null);
    setImportFileErrors([]);
    if (files.length > 3) {
      setError("Choose up to 3 CSV files per import.");
      return;
    }
    const unsupported = files.find((file) => !/\.csv$/i.test(file.name));
    if (unsupported) {
      setError(`${unsupported.name} is not a CSV file. Choose .csv files only.`);
      return;
    }
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setError(`${oversized.name} is larger than 5 MB.`);
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > 15 * 1024 * 1024) {
      setError("The combined size of the selected CSV files must be 15 MB or less.");
      return;
    }

    const { readEducationCsv } = await import("./adminCsv.js");
    const parsedRows = [];
    const fileErrors = [];
    for (const file of files) {
      try {
        const records = await readEducationCsv(file, educationTitles[active] ? active : "");
        parsedRows.push(...records.map((record) => ({ ...record, fileName: file.name })));
      } catch (readError) {
        fileErrors.push(`${file.name}: ${readError.message || "Unable to read this CSV file."}`);
      }
    }
    setImportRows(parsedRows);
    setImportFileErrors(fileErrors);
    if (fileErrors.length && parsedRows.length === 0) setError("None of the selected CSV files could be read.");
  }

  async function importEducationRows() {
    const validRows = importRows.filter((row) => row.errors.length === 0);
    if (!validRows.length) {
      setError("There are no valid course rows to import. Fix the highlighted rows or choose another CSV file.");
      return;
    }
    setImporting(true);
    setError("");
    setImportReport(null);
    let imported = 0;
    const failedRows = [];
    for (const row of validRows) {
      const payload = Object.fromEntries(
        Object.entries(row).filter(([key]) =>
          !["rowNumber", "errors", "fileName", "category"].includes(key)),
      );
      try {
        await apiRequest(`/admin/courses/import/${encodeURIComponent(row.category)}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        imported += 1;
      } catch (importError) {
        failedRows.push({ ...row, errors: [importError.message] });
      }
    }
    try {
      if (imported > 0) await refreshData();
    } catch (refreshError) {
      setError(`Imported ${imported} course(s), but refreshing the course list failed: ${refreshError.message}`);
    }
    const invalidRows = importRows.filter((row) => row.errors.length > 0);
    setImportRows([...invalidRows, ...failedRows]);
    setImportReport({ imported, failed: invalidRows.length + failedRows.length + importFileErrors.length });
    setImporting(false);
  }

  function startEducationForm(category, item = null) {
    setActive(category);
    setFormType("education");
    setEditingId(item?.id ?? null);
    setEducation({
      ...emptyEducation,
      ...(item || {}),
      fees: item?.fees == null ? "" : String(item.fees),
      entranceTypes: item?.entranceTypes || [],
    });
    setError("");
    setNotice("");
  }

  function startJobForm(item = null) {
    setFormType("job");
    setEditingId(item?.id ?? null);
    setJob({ ...emptyJob, ...(item || {}) });
    setError("");
    setNotice("");
  }

  function startUserForm(item = null) {
    setFormType("user");
    setEditingId(item?.id ?? null);
    setUser({ ...emptyUser, ...(item || {}), password: "" });
    setError("");
    setNotice("");
  }

  async function saveRecord(event, type, value) {
    event.preventDefault();
    if (type === "education" && value.entranceTypes.length === 0) {
      setError("Select at least one entrance type.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const path = type === "education"
        ? `/admin/courses${editingId ? `/${editingId}` : ""}`
        : `/admin/${type === "job" ? "jobs" : "users"}${editingId ? `/${editingId}` : ""}`;
      const payload = type === "education"
        ? {
          ...value,
          category: active,
          fees: value.fees === "" ? null : Number(value.fees),
          entranceTestName: value.entranceTypes.includes("Entrance Test")
            ? value.entranceTestName : "",
        }
        : value;
      await apiRequest(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await refreshData();
      setFormType("");
      setEditingId(null);
      setNotice(`${type === "education" ? "Course" : type === "job" ? "Job" : "User"} ${editingId ? "updated" : "added"} successfully.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecord(type, id) {
    if (id == null) {
      setError("Cannot delete this record because its ID is missing.");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;
    try {
      setLoading(true);
      setError("");
      const endpoint = type === "education" ? "courses" : type === "users" ? "users" : "jobs";
      await apiRequest(`/admin/${endpoint}/${id}`, { method: "DELETE" });
      await refreshData();
      setNotice("Record deleted successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("adminToken");
    navigate("/admin-login", { replace: true });
  }

  function renderEducationForm() {
    const priorCategory = active === "pg" ? "graduation" : null;
    const priorBranches = priorCategory
      ? courses.filter((course) => course.category === priorCategory).map((course) => course.branch)
      : courses.filter((course) => ["after10th", "intermediate"].includes(course.category)
        && course.nextStandard === education.previousStandard).map((course) => course.branch);
    const branchOptions = [...new Set(priorBranches.filter(Boolean))];
    const needsPrevious = Boolean(previousLevels[active]);

    return (
      <form className="management-form" onSubmit={(event) => saveRecord(event, "education", education)}>
        <FormHeading title={`${editingId ? "Edit" : "Add"} ${educationTitles[active]}`} onCancel={() => setFormType("")} />
        <div className="management-form-grid">
          {needsPrevious && (
            <>
              <FormField label="Previous Standard" name="previousStandard" value={education.previousStandard}
                onChange={(value) => setEducation({ ...education, previousStandard: value, previousBranch: "" })}
                required options={previousLevels[active]} />
              <FormField label="Previous Branch" name="previousBranch" value={education.previousBranch}
                onChange={(value) => setEducation({ ...education, previousBranch: value })}
                options={branchOptions} listId="previous-branches" />
            </>
          )}
          {active === "after10th" ? (
            <FormField label="Next Level" name="nextStandard" value={education.nextStandard}
              onChange={(value) => setEducation({ ...education, nextStandard: value })}
              required options={nextLevels} />
          ) : (
            <FormField label={active === "intermediate" ? "Course / Stream" : "Next Standard"}
              name="nextStandard" value={education.nextStandard}
              onChange={(value) => setEducation({ ...education, nextStandard: value })} required />
          )}
          <FormField label="Years of Course" name="duration" value={education.duration}
            onChange={(value) => setEducation({ ...education, duration: value })} required options={durations} />
          <FormField label={active === "after10th" ? "Branch / Course" : "Branch"}
            name="branch" value={education.branch}
            onChange={(value) => setEducation({ ...education, branch: value })} required />
          <fieldset className="admin-field field-wide entrance-options">
            <legend>Entrance Type <span aria-hidden="true">*</span></legend>
            {entranceOptions.map((option) => (
              <label className="checkbox-option" key={option}>
                <input type="checkbox" checked={education.entranceTypes.includes(option)}
                  onChange={(event) => setEducation({
                    ...education,
                    entranceTypes: event.target.checked
                      ? [...education.entranceTypes, option]
                      : education.entranceTypes.filter((value) => value !== option),
                  })} />
                {option}
              </label>
            ))}
          </fieldset>
          {education.entranceTypes.includes("Entrance Test") && (
            <FormField label="Entrance Test Name" name="entranceTestName" value={education.entranceTestName}
              onChange={(value) => setEducation({ ...education, entranceTestName: value })}
              placeholder="Enter test name" required />
          )}
          <FormField label="Eligibility" name="eligibility" value={education.eligibility}
            onChange={(value) => setEducation({ ...education, eligibility: value })} />
          <FormField label="Institution / College" name="institution" value={education.institution}
            onChange={(value) => setEducation({ ...education, institution: value })} />
          <FormField label="Fees" name="fees" type="number" value={education.fees}
            onChange={(value) => setEducation({ ...education, fees: value })} min="0" />
          <FormField label="Career Options" name="careerOptions" value={education.careerOptions}
            onChange={(value) => setEducation({ ...education, careerOptions: value })} />
          <FormField label="Description" name="description" type="textarea" value={education.description}
            onChange={(value) => setEducation({ ...education, description: value })} wide />
        </div>
        <button className="primary-button form-submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update Course" : "Save Course"}
        </button>
      </form>
    );
  }

  function renderJobForm() {
    const fields = [
      ["jobTitle", "Job Title", true], ["company", "Company", true],
      ["location", "Location"], ["qualification", "Required Qualification"],
      ["jobType", "Job Type"], ["salary", "Salary / Salary Range"],
      ["applyUrl", "Application URL", false, "url"],
    ];
    return (
      <form className="management-form" onSubmit={(event) => saveRecord(event, "job", job)}>
        <FormHeading title={`${editingId ? "Edit" : "Add"} job`} onCancel={() => setFormType("")} />
        <div className="management-form-grid">
          {fields.map(([name, label, required, type]) => (
            <FormField key={name} label={label} name={`job-${name}`} type={type || "text"}
              value={job[name]} required={required}
              onChange={(value) => setJob({ ...job, [name]: value })} />
          ))}
          <FormField label="Description" name="job-description" type="textarea" wide
            value={job.description} onChange={(value) => setJob({ ...job, description: value })} />
        </div>
        <button className="primary-button form-submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update Job" : "Save Job"}
        </button>
      </form>
    );
  }

  function renderUserForm() {
    return (
      <form className="management-form" onSubmit={(event) => saveRecord(event, "user", user)}>
        <FormHeading title={`${editingId ? "Edit" : "Add"} student account`} onCancel={() => setFormType("")} />
        <div className="management-form-grid">
          <FormField label="Full Name" name="user-name" value={user.fullName}
            onChange={(value) => setUser({ ...user, fullName: value })} required />
          <FormField label="Mobile Number" name="user-phone" type="tel" value={user.phone}
            onChange={(value) => setUser({ ...user, phone: value })} required
            placeholder="10-digit Indian mobile number" />
          <FormField label={editingId ? "New Password (optional)" : "Password"}
            name="user-password" type="password" value={user.password}
            onChange={(value) => setUser({ ...user, password: value })}
            required={!editingId} minLength={editingId ? undefined : 8}
            autoComplete="new-password" />
          <FormField label="Account Status" name="user-status" value={user.status}
            onChange={(value) => setUser({ ...user, status: value })}
            options={["ACTIVE", "PENDING", "APPROVED", "REJECTED"]} required />
        </div>
        <button className="primary-button form-submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update User" : "Create User"}
        </button>
      </form>
    );
  }

  function renderTable(columns, rows, type) {
    if (loading && rows.length === 0) return <p className="empty-state">Loading records...</p>;
    if (!rows.length) {
      return <div className="empty-state"><strong>No records found</strong><p>Add a record to see it here.</p></div>;
    }
    return (
      <div className="table-scroll">
        <table className="admin-table">
          <thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}<th>Actions</th></tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id}>
              {columns.map(([key]) => <td key={key}>{formatCell(row[key])}</td>)}
              <td><div className="table-actions">
                <button className="table-action edit" onClick={() => {
                  if (type === "education") startEducationForm(row.category || active, row);
                  else if (type === "jobs") startJobForm(row);
                  else startUserForm(row);
                }}>Edit</button>
                <button className="table-action delete" onClick={() => deleteRecord(type, row.id)}>Delete</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  }

  function renderContent() {
    if (formType === "education") return renderEducationForm();
    if (formType === "job") return renderJobForm();
    if (formType === "user") return renderUserForm();

    if (active === "users") {
      return <ManagementSection title="Student Accounts" description="Create, update, and remove student accounts."
        action="+ Add User" onAction={() => startUserForm()}
        content={renderTable([["id", "ID"], ["fullName", "Full Name"], ["phone", "Mobile"], ["status", "Status"], ["createdAt", "Created"]], filteredUsers, "users")} />;
    }
    if (active === "courses") {
      return <ManagementSection title="All Courses" description="View and manage courses from every education level."
        content={renderTable([["id", "ID"], ["category", "Education Level"], ["nextStandard", "Next Level / Course"], ["branch", "Branch"], ["duration", "Duration"], ["entranceTypes", "Entrance Type"]], filteredCourses, "education")} />;
    }
    if (educationTitles[active]) {
      const rows = filteredCourses.filter((course) => course.category === active);
      return <ManagementSection title={educationTitles[active]} description="Manage prerequisites, course duration, branches, entrance requirements, and career details."
        action={`+ Add ${educationTitles[active]}`} onAction={() => startEducationForm(active)}
        content={renderTable([["id", "ID"], ["previousStandard", "Previous Standard"], ["previousBranch", "Previous Branch"], ["nextStandard", "Next Level / Course"], ["duration", "Duration"], ["branch", "Branch"], ["entranceTypes", "Entrance Type"], ["entranceTestName", "Entrance Test"]], rows, "education")} />;
    }
    if (active === "jobs") {
      return <ManagementSection title="Jobs & Career Opportunities" description="Manage job listings, qualifications, and application links."
        action="+ Add Job" onAction={() => startJobForm()}
        content={renderTable([["id", "ID"], ["jobTitle", "Job Title"], ["company", "Company"], ["location", "Location"], ["qualification", "Qualification"], ["jobType", "Job Type"], ["salary", "Salary"]], filteredJobs, "jobs")} />;
    }
    if (active === "profile") {
      return <ManagementSection title="Admin Profile" description="Signed in administrator account.">
        <div className="profile-placeholder"><div className="user-avatar large">A</div><div><strong>Administrator</strong><p>Admin account</p></div></div>
      </ManagementSection>;
    }

    return (
      <>
        <section className="stats-grid">
          {[
            ["Total Users", users.length, "♙", "blue"],
            ["Total Courses", courses.length, "▤", "purple"],
            ["Total Jobs", jobs.length, "▣", "green"],
            ...Object.entries(educationTitles).map(([category, label]) => [
              label.replace(" Education", ""),
              courses.filter((course) => course.category === category).length,
              "🎓",
              "orange",
            ]),
          ].map(([label, value, icon, tone]) => (
            <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><h2>{value}</h2></div></article>
          ))}
        </section>
        <section className="management-card">
          <div className="section-heading"><h3>Recently added</h3><p>Latest records currently available in the catalog.</p></div>
          <div className="recent-records-grid">
            <RecentRecords title="Students" rows={[...users]
              .sort((first, second) => Date.parse(second.createdAt || 0) - Date.parse(first.createdAt || 0))
              .slice(0, 5).map((item) => `${item.fullName} · ${item.phone}`)} />
            <RecentRecords title="Courses" rows={[...courses]
              .sort((first, second) => Number(second.id) - Number(first.id))
              .slice(0, 5).map((item) => `${item.nextStandard} · ${item.branch}`)} />
            <RecentRecords title="Jobs" rows={[...jobs]
              .sort((first, second) => Number(second.id) - Number(first.id))
              .slice(0, 5).map((item) => `${item.jobTitle} · ${item.company}`)} />
          </div>
        </section>
        <section className="management-card">
          <div className="section-heading"><h3>Education Management</h3><p>Choose an education level to manage its course records.</p></div>
          <div className="education-button-grid">{Object.entries(educationTitles).map(([id, label]) => (
            <button className="education-button" key={id} onClick={() => chooseSection(id)}><span>{label}</span><strong>Manage →</strong></button>
          ))}</div>
        </section>
        <section className="management-card">
          <div className="section-heading"><h3>Quick Management</h3><p>Jump directly to your key admin records.</p></div>
          <div className="quick-links">
            <button onClick={() => chooseSection("users")}>View All Users</button>
            <button onClick={() => chooseSection("courses")}>View All Courses</button>
            <button onClick={() => chooseSection("jobs")}>View All Jobs</button>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="admin-app">
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand"><span className="brand-mark">CS</span><span><strong>Career Suggestion</strong><small>ADMIN WORKSPACE</small></span></div>
        <div className="sidebar-section-label">MANAGEMENT</div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {sections.map((section) => <button key={section.id} className={`sidebar-link ${active === section.id ? "active" : ""}`} onClick={() => chooseSection(section.id)}><span className="nav-icon">{section.icon}</span><span>{section.label}</span></button>)}
        </nav>
        <div className="sidebar-bottom"><div className="admin-help"><strong>Admin workspace</strong><p>Manage students and career information securely.</p></div><button className="logout-button" onClick={logout}>↪ Sign out</button></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>☰</button>
          <div className="breadcrumb">Admin <span>/</span> <strong>{title}</strong></div>
          <div className="topbar-user"><div className="user-avatar">A</div><div className="topbar-user-text"><strong>Administrator</strong><small>Admin account</small></div></div>
        </header>
        <main className="dashboard-content">
          <div className="page-heading"><div><span className="eyebrow">CAREER SUGGESTION FOR STUDENTS</span><h1>{active === "overview" ? "Dashboard Overview" : title}</h1><p>Manage students, education pathways, and job opportunities.</p></div><span className="status-pill"><span className="status-dot" /> Admin workspace</span></div>
          {error && <div className="admin-alert error" role="alert">{error}</div>}
          {notice && <div className="admin-alert success" role="status">{notice}</div>}
          {(["users", "courses", "jobs"].includes(active) || educationTitles[active]) && !formType && <div className="toolbar">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} aria-label={`Search ${title}`} />
            {active === "users" && <button className="primary-button" onClick={() => startUserForm()}>+ Add User</button>}
            {active === "jobs" && <button className="primary-button" onClick={() => startJobForm()}>+ Add Job</button>}
            {active === "courses" && <button className="primary-button" onClick={() => chooseSection("after10th")}>Manage Education</button>}
            {(["courses", ...Object.keys(educationTitles)].includes(active)) && <>
              <a className="secondary-button excel-template-button" href="/import-templates/after-10th-courses.csv" download>After 10th CSV</a>
              <a className="secondary-button excel-template-button" href="/import-templates/graduation-courses.csv" download>Graduation CSV</a>
              <a className="secondary-button excel-template-button" href="/import-templates/post-graduation-courses.csv" download>Post-grad CSV</a>
              <button type="button" className="primary-button excel-import-button" onClick={() => csvInputRef.current?.click()} disabled={importing}>Import up to 3 CSVs</button>
              <input ref={csvInputRef} className="excel-file-input" type="file" accept=".csv,text/csv" multiple onChange={handleCsvFile} aria-label="Choose up to three education courses CSV files" />
            </>}
          </div>}
          {importFileErrors.length > 0 && <div className="admin-alert error" role="alert">
            {importFileErrors.map((fileError) => <div key={fileError}>{fileError}</div>)}
          </div>}
          {importReport && <div className={`import-summary ${importReport.failed ? "has-failures" : ""}`} role="status">
            <strong>CSV import finished</strong>
            <span>{importReport.imported} course{importReport.imported === 1 ? "" : "s"} added</span>
            {importReport.failed > 0 && <span>{importReport.failed} import issue{importReport.failed === 1 ? "" : "s"} need attention</span>}
            <button type="button" onClick={() => setImportReport(null)}>Dismiss</button>
          </div>}
          {importRows.length > 0 && <section className="excel-preview-card">
            <div className="excel-preview-heading">
              <div><h2>Review course import</h2><p>{importRows.length} row{importRows.length === 1 ? "" : "s"} from up to 3 files. Invalid rows will be skipped.</p></div>
              <button type="button" className="secondary-button" onClick={() => { setImportRows([]); setImportReport(null); }} disabled={importing}>Clear file</button>
            </div>
            <div className="excel-preview-list">
              {importRows.map((row) => <article className={`excel-preview-row${row.errors.length ? " invalid" : ""}`} key={`${row.fileName}-${row.rowNumber}`}>
                <span className="excel-row-number">Row {row.rowNumber}</span>
                <div className="excel-row-summary"><strong>{row.nextStandard || "Untitled course"}</strong><span>{row.fileName} · {row.category} · {row.branch || "No branch"} · {row.duration || "No duration"}</span></div>
                <span className={`excel-row-status${row.errors.length ? " invalid" : ""}`}>{row.errors.length ? row.errors.join(" ") : "Ready to import"}</span>
              </article>)}
            </div>
            <div className="excel-preview-footer">
              <span>{importRows.filter((row) => row.errors.length === 0).length} valid · {importRows.filter((row) => row.errors.length > 0).length} invalid</span>
              <button type="button" className="primary-button" onClick={importEducationRows} disabled={importing || !importRows.some((row) => row.errors.length === 0)}>
                {importing ? "Importing courses..." : "Import valid courses"}
              </button>
            </div>
          </section>}
          {renderContent()}
          <footer className="dashboard-footer"><span>© {new Date().getFullYear()} Career Suggestion for Students</span><span>Admin Workspace</span></footer>
        </main>
      </div>
    </div>
  );
}

function filterRows(rows, search) {
  const query = search.trim().toLowerCase();
  return query ? rows.filter((row) => Object.values(row).some((value) =>
    String(value ?? "").toLowerCase().includes(query))) : rows;
}

function formatCell(value) {
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (value == null || value === "") return "—";
  if (typeof value === "string" && value.includes("T") && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

function FormField({
  label, name, value, onChange, type = "text", required = false, options = null,
  wide = false, min, minLength, placeholder = "", listId, autoComplete,
}) {
  const id = `field-${name}`;
  const className = `admin-field ${wide || type === "textarea" ? "field-wide" : ""}`;
  return (
    <div className={className}>
      <label htmlFor={id}>{label}</label>
      {options && !listId ? (
        <select id={id} value={value} required={required} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select...</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea id={id} value={value} required={required} placeholder={placeholder} rows={4}
          onChange={(event) => onChange(event.target.value)} />
      ) : (
        <>
          <input id={id} type={type} value={value ?? ""} required={required} min={min}
            minLength={minLength} placeholder={placeholder} list={listId}
            autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} />
          {listId && <datalist id={listId}>{options?.map((option) => <option key={option} value={option} />)}</datalist>}
        </>
      )}
    </div>
  );
}

function FormHeading({ title, onCancel }) {
  return <div className="form-heading"><div><h3>{title}</h3><p>Enter the required details below.</p></div><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button></div>;
}

function ManagementSection({ title, description, action, onAction, content, children }) {
  return (
    <section className="management-card">
      <div className="section-heading"><div><h3>{title}</h3><p>{description}</p></div></div>
      {action && <div className="category-actions"><button className="primary-button" onClick={onAction}>{action}</button></div>}
      {content || children}
    </section>
  );
}

function RecentRecords({ title, rows }) {
  return (
    <div className="recent-records">
      <h4>{title}</h4>
      {rows.length ? <ul>{rows.map((row) => <li key={row}>{row}</li>)}</ul> : <p>No records yet.</p>}
    </div>
  );
}
