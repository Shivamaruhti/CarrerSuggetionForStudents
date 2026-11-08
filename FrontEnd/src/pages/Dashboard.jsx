import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import {
  FaArrowLeft, FaArrowRight, FaBookOpen, FaBriefcase, FaGraduationCap,
  FaHome, FaLock, FaSignOutAlt, FaUser, FaUserEdit,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const qualifications = [
  ["CLASS_10", "After 10th / Class 10 completed"],
  ["CLASS_12", "Intermediate / Class 12 completed"],
  ["DIPLOMA", "Diploma completed"],
  ["GRADUATION", "Graduation completed"],
  ["POST_GRADUATION", "Post-Graduation completed"],
  ["OTHER", "Other qualification"],
];
const nextCategory = { after10th: "graduation", graduation: "pg" };

const emptyProfile = {
  qualification: "",
  stream: "",
  preferredField: "",
  preferredLocation: "",
};

async function studentRequest(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (response.status === 401) {
    sessionStorage.removeItem("careerpath.studentToken");
    sessionStorage.removeItem("careerpath.student");
    window.location.assign("/login");
    throw new Error("Your session expired. Please sign in again.");
  }
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.detail || `Request failed (${response.status}).`);
  return result;
}

function Info({ label, value }) {
  if (value == null || value === "") return null;
  return <p className="journey-detail"><strong>{label}:</strong> {value}</p>;
}

function SelectedPathPreview({ courses }) {
  if (!courses.length) return null;
  return (
    <section className="selected-path-preview" aria-label="Your selected eligible path">
      <div className="selected-path-heading">
        <span className="journey-eyebrow">YOUR SELECTED ELIGIBLE PATH</span>
        <span>{courses.length} {courses.length === 1 ? "step" : "steps"} selected</span>
      </div>
      <ol className="selected-path-tree">
        {courses.map((course, index) => (
          <li key={`${course.id}-${index}`}>
            <span className="selected-path-number">{index + 1}</span>
            <div className="selected-path-node">
              <strong>{course.nextStandard}</strong>
              <span>{course.branch} · {course.duration}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("careerpath.studentToken");
  const student = JSON.parse(sessionStorage.getItem("careerpath.student") || "{}");
  const [activeView, setActiveView] = useState("home");
  const [account, setAccount] = useState(student);
  const [accountDraft, setAccountDraft] = useState({
    fullName: student.fullName || "",
    phone: student.phone || "",
  });
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profile, setProfile] = useState(emptyProfile);
  const [journeyCourses, setJourneyCourses] = useState([]);
  const [journeyCategory, setJourneyCategory] = useState("");
  const [jobs, setJobs] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [journeyMode, setJourneyMode] = useState("");
  const [journeyStep, setJourneyStep] = useState("start");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedPath, setSelectedPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadJourney = useCallback(async () => {
    const [savedAccount, savedProfile, savedRoadmap] = await Promise.all([
      studentRequest("/student/account", token),
      studentRequest("/student/profile", token),
      studentRequest("/student/roadmap", token),
    ]);
    setAccount(savedAccount);
    setAccountDraft({ fullName: savedAccount.fullName || "", phone: savedAccount.phone || "" });
    setProfile({
      qualification: savedProfile.qualification || "",
      stream: savedProfile.stream || "",
      preferredField: savedProfile.preferredField || "",
      preferredLocation: savedProfile.preferredLocation || "",
    });
    setRoadmap(savedRoadmap);
    if (savedProfile.qualification) {
      const jobData = await studentRequest("/student/jobs", token);
      setJobs(jobData);
    } else {
      setJobs([]);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await loadJourney();
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [loadJourney]);

  const completion = useMemo(() => roadmap.length
    ? Math.round((roadmap.filter((step) => step.completed).length / roadmap.length) * 100)
    : 0, [roadmap]);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await studentRequest("/student/profile", token, {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      await loadJourney();
      setJourneyMode("");
      setJourneyStep("start");
      setSelectedCourse(null);
      setSelectedPath([]);
      setNotice("Your profile and recommendations have been updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveAccount(event) {
    event.preventDefault();
    setSavingAccount(true);
    setError("");
    setNotice("");
    try {
      const savedAccount = await studentRequest("/student/account", token, {
        method: "PUT",
        body: JSON.stringify({
          fullName: accountDraft.fullName.trim(),
          phone: accountDraft.phone,
        }),
      });
      setAccount(savedAccount);
      setAccountDraft({ fullName: savedAccount.fullName, phone: savedAccount.phone });
      sessionStorage.setItem("careerpath.student", JSON.stringify(savedAccount));
      setNotice("Your account details have been updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingAccount(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      setError("Your new password and confirmation do not match.");
      return;
    }
    setChangingPassword(true);
    try {
      await studentRequest("/student/password", token, {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwordDraft.currentPassword,
          newPassword: passwordDraft.newPassword,
        }),
      });
      setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice("Your password has been changed successfully.");
    } catch (passwordError) {
      setError(passwordError.message);
    } finally {
      setChangingPassword(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("careerpath.studentToken");
    sessionStorage.removeItem("careerpath.student");
    navigate("/login", { replace: true });
  }

  async function roadmapAction(courseId, method, body) {
    setError("");
    setNotice("");
    try {
      await studentRequest(`/student/roadmap/${courseId}`, token, {
        method,
        body: body == null ? undefined : JSON.stringify(body),
      });
      await loadJourney();
      setNotice(method === "DELETE" ? "Course removed from your roadmap." : "Roadmap saved.");
      return true;
    } catch (actionError) {
      setError(actionError.message);
      return false;
    }
  }

  async function fetchCoursesForPath(category) {
    if (category === "after10th") {
      return studentRequest("/student/courses/after10th", token);
    }
    return studentRequest("/student/courses", token);
  }

  async function startJourney(mode) {
    setJourneyMode(mode);
    setSelectedPath([]);
    setSelectedCourse(null);
    setError("");
    setNotice("");
    if (!profile.qualification) {
      setJourneyStep("qualification");
      return;
    }
    if (mode === "jobs") {
      setJourneyStep("jobs");
      return;
    }
    const category = {
      CLASS_10: "after10th",
      CLASS_12: "graduation",
      DIPLOMA: "graduation",
      GRADUATION: "pg",
    }[profile.qualification];
    if (!category) {
      setJourneyStep("courses");
      setJourneyCourses([]);
      setJourneyCategory("");
      return;
    }
    setSaving(true);
    try {
      const courseData = await fetchCoursesForPath(category);
      setJourneyCategory(category);
      setJourneyCourses(courseData.filter((course) => course.category === category));
      setJourneyStep("courses");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveJourneyQualification(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await studentRequest("/student/profile", token, {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      await loadJourney();
      if (journeyMode === "jobs") {
        setJobs(await studentRequest("/student/jobs", token));
        setJourneyStep("jobs");
      } else {
        const category = {
          CLASS_10: "after10th",
          CLASS_12: "graduation",
          DIPLOMA: "graduation",
          GRADUATION: "pg",
        }[profile.qualification];
        setJourneyCategory(category || "");
        const courseData = category ? await fetchCoursesForPath(category) : [];
        setJourneyCourses(courseData.filter((course) => course.category === category));
        setJourneyStep("courses");
      }
      setNotice("Your qualification is saved. Here are the next options for you.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function chooseCourse(course) {
    let selected = course;
    if (course.legacyCourseId) {
      setError("");
      setNotice("");
      setSaving(true);
      try {
        const savedStep = await studentRequest(
          `/student/roadmap/after10th/${course.legacyCourseId}`,
          token,
          { method: "POST" },
        );
        await loadJourney();
        selected = { ...course, id: savedStep.courseId };
      } catch (requestError) {
        setError(requestError.message);
        return;
      } finally {
        setSaving(false);
      }
    } else {
      const added = await roadmapAction(course.id, "POST");
      if (!added) return;
    }
    setSelectedPath((current) => [...current, selected]);
    setSelectedCourse(selected);
    setJourneyStep("direction");
    setNotice(`${selected.nextStandard} — ${selected.branch} added to your roadmap.`);
  }

  async function showHigherEducation() {
    const category = nextCategory[journeyCategory];
    if (!category || !selectedCourse) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const query = new URLSearchParams({
        category,
        previousStandard: selectedCourse.nextStandard,
        previousBranch: selectedCourse.branch,
      });
      const nextCourses = await studentRequest(`/student/courses?${query}`, token);
      setJourneyCategory(category);
      setJourneyCourses(nextCourses);
      setJourneyStep("courses");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function showMatchedJobs(qualification, branch) {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const query = new URLSearchParams();
      if (qualification) query.set("qualification", qualification);
      if (branch) query.set("branch", branch);
      const jobData = await studentRequest(`/student/jobs${query.size ? `?${query}` : ""}`, token);
      setJobs(jobData);
      setJourneyStep("jobs");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const roadmapIds = new Set(roadmap.map((step) => step.courseId));

  if (loading) {
    return <div className="journey-loading"><Spinner animation="border" role="status" /><span>Loading your career journey...</span></div>;
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar" aria-label="Student dashboard">
        <div className="dashboard-user">
          <div className="dashboard-avatar">{(account.fullName || "S").charAt(0).toUpperCase()}</div>
          <div><strong>{account.fullName || "Student"}</strong><span>Student account</span></div>
        </div>
        <p className="dashboard-nav-label">WORKSPACE</p>
        <nav className="dashboard-nav">
          <button type="button" className={activeView === "home" ? "active" : ""} onClick={() => setActiveView("home")}><FaHome />Dashboard</button>
          <button type="button" className={activeView === "profile" ? "active" : ""} onClick={() => setActiveView("profile")}><FaUser />My profile</button>
          <button type="button" className={activeView === "update" ? "active" : ""} onClick={() => setActiveView("update")}><FaUserEdit />Update details</button>
          <button type="button" className={activeView === "password" ? "active" : ""} onClick={() => setActiveView("password")}><FaLock />Change password</button>
        </nav>
        <button type="button" className="dashboard-logout" onClick={logout}><FaSignOutAlt />Sign out</button>
        <div className="dashboard-sidebar-note"><FaBookOpen /><span>Your next chapter starts with one small step.</span></div>
      </aside>

      <div className="dashboard-content">
        <div className="dashboard-mobile-heading">
          <span>STUDENT WORKSPACE</span>
          <strong>{account.fullName || "Welcome"}</strong>
        </div>
        {error && <div className="alert alert-danger dashboard-alert" role="alert">{error}</div>}
        {notice && <div className="alert alert-success dashboard-alert" role="status">{notice}</div>}

        {activeView === "home" ? <div className="student-dashboard">
      <section className="journey-hero">
        <div>
          <span className="journey-eyebrow">YOUR CAREER JOURNEY</span>
          <h1>Welcome, {account.fullName || "Student"}</h1>
          <p>Explore education options that match your qualification, then save the next steps in your own roadmap.</p>
        </div>
        <div className="journey-progress" aria-label={`${completion}% roadmap complete`}>
          <span>{completion}%</span><small>roadmap complete</small>
        </div>
      </section>

      <section className="journey-section">
        <div className="journey-section-heading">
          <div><span className="journey-step">01</span><h2>Choose your next step</h2></div>
          <p>Explore education options one level at a time, or find jobs that match your qualification.</p>
        </div>
        <div className="career-flow">
          {journeyStep === "start" && (
            <div className="career-choice-grid">
              <button type="button" className="career-choice-card education-choice" onClick={() => startJourney("education")}>
                <span className="career-choice-icon"><FaGraduationCap /></span>
                <span className="career-choice-copy"><strong>Explore education</strong><small>Find courses for your qualification and build a study pathway.</small></span>
                <FaArrowRight className="career-choice-arrow" />
              </button>
              <button type="button" className="career-choice-card jobs-choice" onClick={() => startJourney("jobs")}>
                <span className="career-choice-icon"><FaBriefcase /></span>
                <span className="career-choice-copy"><strong>Explore jobs</strong><small>See career opportunities relevant to your current or chosen course.</small></span>
                <FaArrowRight className="career-choice-arrow" />
              </button>
            </div>
          )}

          {journeyStep === "qualification" && (
            <div className="career-step-panel">
              <button type="button" className="career-back-button" onClick={() => setJourneyStep("start")}><FaArrowLeft /> Back to options</button>
              <h3>What is your current qualification?</h3>
              <p>We’ll use this to find the right starting point for your journey.</p>
              <Form onSubmit={saveJourneyQualification}>
                <Row className="g-3">
                  <Col md={6}><Form.Group controlId="journeyQualification"><Form.Label>Highest completed qualification</Form.Label>
                    <Form.Select value={profile.qualification} onChange={(event) => updateProfile("qualification", event.target.value)} required>
                      <option value="">Choose your qualification</option>
                      {qualifications.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Form.Select>
                  </Form.Group></Col>
                  <Col md={6}><Form.Group controlId="journeyStream"><Form.Label>Stream or specialization <span className="text-muted">(optional)</span></Form.Label>
                    <Form.Control value={profile.stream} onChange={(event) => updateProfile("stream", event.target.value)} maxLength={100} placeholder="For example, MPC or Computer Science" />
                  </Form.Group></Col>
                </Row>
                <Button className="journey-primary mt-3" type="submit" disabled={saving}>{saving ? "Finding options..." : "Show my options"} <FaArrowRight className="ms-2" /></Button>
              </Form>
            </div>
          )}

          {journeyStep === "courses" && (
            <div className="career-step-panel">
              <div className="career-step-toolbar">
                <div><span className="journey-eyebrow">YOUR EDUCATION PATH</span><h3>{journeyCategory === "after10th" ? "After 10th" : journeyCategory === "graduation" ? "Graduation courses" : journeyCategory === "pg" ? "Post-graduation courses" : "Higher education"}</h3></div>
                <Button variant="outline-success" size="sm" onClick={() => setJourneyStep("start")}><FaArrowLeft className="me-2" />Change direction</Button>
              </div>
              <SelectedPathPreview courses={selectedPath} />
              {journeyCourses.length === 0 ? (
                <div className="journey-empty">
                  <strong>No matching courses found at this level.</strong>
                  <p>Check back later or explore job options related to your selected qualification.</p>
                  <Button className="journey-primary" onClick={() => showMatchedJobs(selectedCourse?.nextStandard || "", selectedCourse?.branch || "")} disabled={saving}>Explore matching jobs</Button>
                </div>
              ) : (
                <div className="career-course-table-wrap">
                  <table className="career-course-table">
                    <thead><tr><th>Next level / course</th><th>Duration</th><th>Stream / branch</th><th>Entrance type</th><th>Test name</th><th><span className="visually-hidden">Action</span></th></tr></thead>
                    <tbody>{journeyCourses.map((course) => (
                      <tr key={course.id}>
                        <td data-label="Next level / course"><strong>{course.nextStandard}</strong></td>
                        <td data-label="Duration">{course.duration}</td>
                        <td data-label="Stream / branch"><span className="career-branch-tag">{course.branch}</span></td>
                        <td data-label="Entrance type">{course.entranceTypes?.length ? course.entranceTypes.join(", ") : "Not specified"}</td>
                        <td data-label="Test name">{course.entranceTestName || "No test listed"}</td>
                        <td data-label="Action"><Button className="career-next-button" size="sm" onClick={() => chooseCourse(course)} disabled={saving}>{roadmapIds.has(course.id) ? "Continue" : "Next"} <FaArrowRight className="ms-1" /></Button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {journeyStep === "direction" && selectedCourse && (
            <div className="career-step-panel">
              <button type="button" className="career-back-button" onClick={() => setJourneyStep("courses")}><FaArrowLeft /> Back to courses</button>
              <div className="career-selected-course">
                <span className="career-selected-check">✓</span>
                <div><span className="journey-eyebrow">ADDED TO YOUR ROADMAP</span><h3>{selectedCourse.nextStandard} <span>· {selectedCourse.branch}</span></h3><p>{selectedCourse.duration}{selectedCourse.entranceTypes?.length ? ` · ${selectedCourse.entranceTypes.join(", ")}` : ""}</p></div>
              </div>
              <SelectedPathPreview courses={selectedPath} />
              <h3 className="career-direction-title">What would you like to do next?</h3>
              <div className="career-choice-grid career-choice-grid-next">
                <button type="button" className={`career-choice-card education-choice${!nextCategory[journeyCategory] ? " is-disabled" : ""}`} onClick={showHigherEducation} disabled={!nextCategory[journeyCategory] || saving}>
                  <span className="career-choice-icon"><FaGraduationCap /></span>
                  <span className="career-choice-copy"><strong>Higher education</strong><small>{nextCategory[journeyCategory] ? "See courses that continue from this qualification and branch." : "No higher course level is listed after this selection."}</small></span>
                  <FaArrowRight className="career-choice-arrow" />
                </button>
                <button type="button" className="career-choice-card jobs-choice" onClick={() => showMatchedJobs(selectedCourse.nextStandard, selectedCourse.branch)} disabled={saving}>
                  <span className="career-choice-icon"><FaBriefcase /></span>
                  <span className="career-choice-copy"><strong>Explore jobs</strong><small>Find jobs matching {selectedCourse.nextStandard} {selectedCourse.branch}.</small></span>
                  <FaArrowRight className="career-choice-arrow" />
                </button>
              </div>
            </div>
          )}

          {journeyStep === "jobs" && (
            <div className="career-step-panel">
              <div className="career-step-toolbar">
                <div><span className="journey-eyebrow">CAREER OPTIONS</span><h3>Jobs matched to your journey</h3></div>
                <Button variant="outline-success" size="sm" onClick={() => setJourneyStep(selectedCourse ? "direction" : "start")}><FaArrowLeft className="me-2" />Back</Button>
              </div>
              {jobs.length === 0 ? <div className="journey-empty">No matching jobs are listed yet. Check back as new opportunities are added.</div> : (
                <Row className="g-3">
                  {jobs.map((job) => <Col key={job.id} md={6}>
                    <Card className="journey-option h-100"><Card.Body>
                      <Badge bg="light" text="dark">{job.jobType || "Career opportunity"}</Badge>
                      <h3>{job.jobTitle}</h3>
                      <p className="journey-branch">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
                      <Info label="Qualification" value={job.qualification} />
                      <Info label="Salary" value={job.salary} />
                      {job.description && <p className="journey-description">{job.description}</p>}
                      {job.applyUrl && <a className="btn btn-outline-success btn-sm mt-2" href={job.applyUrl} target="_blank" rel="noreferrer">View opportunity <FaArrowRight className="ms-1" /></a>}
                    </Card.Body></Card>
                  </Col>)}
                </Row>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="journey-section">
        <div className="journey-section-heading">
          <div><span className="journey-step">03</span><h2>Your saved roadmap</h2></div>
          <p>Follow your selected courses from one milestone to the next. Mark each step complete as you progress.</p>
        </div>
        {!roadmap.length ? (
          <div className="journey-empty roadmap-empty">
            <FaGraduationCap />
            <div><strong>Your roadmap starts with a course choice.</strong><p>Choose education above, then select “Next” on a course to add your first milestone.</p></div>
          </div>
        ) : (
          <div className="roadmap-tree" aria-label="Your education roadmap">
            <div className="roadmap-tree-start"><span />Starting from {qualifications.find(([value]) => value === profile.qualification)?.[1] || "your current qualification"}{profile.stream ? ` · ${profile.stream}` : ""}</div>
            {roadmap.map((step, index) => (
              <article className={`roadmap-tree-node${step.completed ? " is-complete" : ""}`} key={step.courseId}>
                <span className="roadmap-tree-connector" aria-hidden="true" />
                <span className="roadmap-index" aria-label={step.completed ? "Completed" : `Step ${index + 1}`}>{step.completed ? "✓" : index + 1}</span>
                <div className="roadmap-node-card">
                  <div className="roadmap-node-heading">
                    <div><span className="roadmap-node-kicker">{step.completed ? "COMPLETED MILESTONE" : `STEP ${String(index + 1).padStart(2, "0")}`}</span>
                      <h3>{step.courseName}</h3><p>{step.branch} <span aria-hidden="true">·</span> {step.duration}</p></div>
                    <span className={`roadmap-status${step.completed ? " complete" : ""}`}>{step.completed ? "Done" : index === roadmap.findIndex((item) => !item.completed) ? "In progress" : "Upcoming"}</span>
                  </div>
                  {(step.eligibility || step.careerOptions) && <div className="roadmap-node-details">
                    <Info label="Eligibility" value={step.eligibility} />
                    <Info label="Career outcomes" value={step.careerOptions} />
                  </div>}
                  <div className="roadmap-actions">
                    <Form.Check type="switch" id={`completed-${step.courseId}`} label={step.completed ? "Completed" : "Mark complete"}
                      checked={step.completed}
                      onChange={(event) => roadmapAction(step.courseId, "PATCH", { completed: event.target.checked })} />
                    <Button variant="link" className="text-danger" onClick={() => roadmapAction(step.courseId, "DELETE")}>Remove step</Button>
                  </div>
                </div>
              </article>
            ))}
            <div className="roadmap-tree-end"><span />Career opportunities</div>
          </div>
        )}
      </section>

      <p className="journey-disclaimer">Career and course recommendations are guidance only and do not guarantee admission, qualification, or employment.</p>
        </div> : null}

        {activeView === "profile" && (
          <section className="account-page">
            <div className="account-page-heading">
              <span className="journey-eyebrow">YOUR ACCOUNT</span>
              <h1>My profile</h1>
              <p>Your personal details and career preferences, all in one place.</p>
            </div>
            <Card className="account-card">
              <Card.Body>
                <div className="account-card-heading">
                  <div className="dashboard-avatar dashboard-avatar-large">{(account.fullName || "S").charAt(0).toUpperCase()}</div>
                  <div><h2>{account.fullName || "Student"}</h2><p>{account.phone ? `+91 ${account.phone}` : "Add a mobile number to your account"}</p></div>
                  <Badge bg="success" className="ms-auto">{account.status || "ACTIVE"}</Badge>
                </div>
                <div className="account-details-grid">
                  <div><span>Full name</span><strong>{account.fullName || "Not provided"}</strong></div>
                  <div><span>Mobile number</span><strong>{account.phone ? `+91 ${account.phone}` : "Not provided"}</strong></div>
                  <div><span>Highest qualification</span><strong>{qualifications.find(([value]) => value === profile.qualification)?.[1] || "Not added yet"}</strong></div>
                  <div><span>Stream / specialization</span><strong>{profile.stream || "Not added yet"}</strong></div>
                  <div><span>Preferred career field</span><strong>{profile.preferredField || "Not added yet"}</strong></div>
                  <div><span>Preferred location</span><strong>{profile.preferredLocation || "Not added yet"}</strong></div>
                </div>
                <Button className="journey-primary mt-4" onClick={() => setActiveView("update")}>Update my details</Button>
              </Card.Body>
            </Card>
            <div className="account-help-card"><FaLock /><div><strong>Keep your account secure</strong><p>Choose a strong password and never share it with anyone.</p></div><Button variant="outline-success" onClick={() => setActiveView("password")}>Change password</Button></div>
          </section>
        )}

        {activeView === "update" && (
          <section className="account-page">
            <div className="account-page-heading">
              <span className="journey-eyebrow">KEEP IT UP TO DATE</span>
              <h1>Update your details</h1>
              <p>Make sure your contact details and career preferences reflect your goals.</p>
            </div>
            <Card className="account-card mb-4">
              <Card.Body>
                <div className="journey-section-heading"><div><span className="journey-step">01</span><h2>Personal details</h2></div><p>These details are used to identify your account.</p></div>
                <Form onSubmit={saveAccount}>
                  <Row className="g-3">
                    <Col md={6}><Form.Group controlId="accountFullName"><Form.Label>Full name</Form.Label><Form.Control value={accountDraft.fullName} onChange={(event) => setAccountDraft((current) => ({ ...current, fullName: event.target.value }))} maxLength={120} autoComplete="name" required /></Form.Group></Col>
                    <Col md={6}><Form.Group controlId="accountPhone"><Form.Label>Mobile number</Form.Label><div className="input-group"><span className="input-group-text">+91</span><Form.Control type="tel" value={accountDraft.phone} onChange={(event) => setAccountDraft((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))} pattern="[6-9][0-9]{9}" maxLength={10} inputMode="numeric" autoComplete="tel-national" required /></div></Form.Group></Col>
                  </Row>
                  <Button className="journey-primary mt-3" type="submit" disabled={savingAccount}>{savingAccount ? "Saving..." : "Save personal details"}</Button>
                </Form>
              </Card.Body>
            </Card>
            <Card className="account-card">
              <Card.Body>
                <div className="journey-section-heading"><div><span className="journey-step">02</span><h2>Education & career preferences</h2></div><p>We'll use these details to refresh your course and job recommendations.</p></div>
                <Form onSubmit={saveProfile}>
                  <Row className="g-3">
                    <Col md={6}><Form.Group controlId="editQualification"><Form.Label>Highest completed qualification</Form.Label><Form.Select value={profile.qualification} onChange={(event) => updateProfile("qualification", event.target.value)} required><option value="">Select your qualification</option>{qualifications.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Form.Select></Form.Group></Col>
                    <Col md={6}><Form.Group controlId="editStream"><Form.Label>Stream or specialization</Form.Label><Form.Control value={profile.stream} onChange={(event) => updateProfile("stream", event.target.value)} maxLength={100} placeholder="e.g. Science, Commerce, Computer Science" /></Form.Group></Col>
                    <Col md={6}><Form.Group controlId="editPreferredField"><Form.Label>Preferred study or career field</Form.Label><Form.Control value={profile.preferredField} onChange={(event) => updateProfile("preferredField", event.target.value)} maxLength={160} placeholder="e.g. Engineering, Healthcare, Business" /></Form.Group></Col>
                    <Col md={6}><Form.Group controlId="editPreferredLocation"><Form.Label>Preferred location</Form.Label><Form.Control value={profile.preferredLocation} onChange={(event) => updateProfile("preferredLocation", event.target.value)} maxLength={160} placeholder="City, state, or anywhere" /></Form.Group></Col>
                  </Row>
                  <Button className="journey-primary mt-3" type="submit" disabled={saving}>{saving ? "Saving..." : "Save preferences & refresh recommendations"}</Button>
                </Form>
              </Card.Body>
            </Card>
          </section>
        )}

        {activeView === "password" && (
          <section className="account-page">
            <div className="account-page-heading">
              <span className="journey-eyebrow">ACCOUNT SECURITY</span>
              <h1>Change password</h1>
              <p>Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.</p>
            </div>
            <Card className="account-card password-card"><Card.Body>
              <div className="password-intro"><span className="password-icon"><FaLock /></span><div><h2>Choose a new password</h2><p>Your password is encrypted and never shown to anyone.</p></div></div>
              <Form onSubmit={changePassword}>
                <Form.Group controlId="currentPassword" className="mb-3"><Form.Label>Current password</Form.Label><Form.Control type="password" autoComplete="current-password" value={passwordDraft.currentPassword} onChange={(event) => setPasswordDraft((current) => ({ ...current, currentPassword: event.target.value }))} required /></Form.Group>
                <Form.Group controlId="newPassword" className="mb-3"><Form.Label>New password</Form.Label><Form.Control type="password" autoComplete="new-password" value={passwordDraft.newPassword} onChange={(event) => setPasswordDraft((current) => ({ ...current, newPassword: event.target.value }))} minLength={8} maxLength={72} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,72}" required /><Form.Text>At least 8 characters, including uppercase, lowercase, and a number.</Form.Text></Form.Group>
                <Form.Group controlId="confirmPassword" className="mb-4"><Form.Label>Confirm new password</Form.Label><Form.Control type="password" autoComplete="new-password" value={passwordDraft.confirmPassword} onChange={(event) => setPasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))} minLength={8} required /></Form.Group>
                <Button className="journey-primary" type="submit" disabled={changingPassword}>{changingPassword ? "Updating password..." : "Update password"}</Button>
              </Form>
            </Card.Body></Card>
          </section>
        )}
      </div>
    </div>
  );
}
