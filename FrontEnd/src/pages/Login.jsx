import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaGraduationCap, FaPhoneAlt, FaLock, FaEye, FaEyeSlash, FaUserPlus } from "react-icons/fa";
import loginImage from "../assets/login.jpg";
import { getApiErrorMessage, loginStudent } from "../api/auth";
import { useNotification } from "../components/useNotification";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useNotification();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.notification) {
      notify(location.state.notification);
      navigate(location.pathname, { replace: true, state: null });
    } else if (location.state?.message) {
      notify({ title: "Account created", message: location.state.message, type: "success" });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, notify]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      notify({ title: "Check your mobile number", message: "Please enter a valid 10-digit Indian mobile number.", type: "warning" });
      return;
    }

    if (!password.trim()) {
      notify({ title: "Password required", message: "Please enter your password.", type: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await loginStudent({ phone, password });
      sessionStorage.setItem("careerpath.student", JSON.stringify(data.student));
      sessionStorage.setItem("careerpath.studentToken", data.token);
      notify({ title: "Welcome back!", message: "You have logged in successfully.", type: "success" });
      navigate("/dashboard");
    } catch (error) {
      notify({ title: "Login failed", message: getApiErrorMessage(error, "Unable to log in. Please try again."), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      
      {/* Login Section */}
      <main className="container login-container">
        <div className="row align-items-center  login-card">

          {/* Left Illustration */}
          <div className="col-lg-6 login-illustration">
            <div className="illustration-content">
              <span className="welcome-badge">
                YOUR FUTURE STARTS HERE
              </span>

              <h1>
                Discover Your
                <br />
                <span>Dream Career.</span>
              </h1>

              <p>
                Find the right career path, explore your strengths,
                and take the next step toward a successful future.
              </p>

              <img
                src={loginImage}
                alt="Student exploring career opportunities"
                className="login-image"
              />

              <div className="feature-points">
                <div>
                  <span className="feature-check">✓</span>
                  Personalized career guidance
                </div>
                <div>
                  <span className="feature-check">✓</span>
                  Skills and career recommendations
                </div>
                <div>
                  <span className="feature-check">✓</span>
                  Plan your future with confidence
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Form */}
          <div className="col-lg-6 login-form-section">
            <div className="login-form-wrapper">
              <div className="form-heading-icon">
                <FaGraduationCap />
              </div>

              <p className="form-welcome">WELCOME BACK!</p>
              <h2>Login to your account</h2>
              <p className="form-description">
                Enter your details to continue your career journey.
              </p>

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label htmlFor="phone" className="form-label">
                    Mobile Number
                  </label>

                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FaPhoneAlt />
                    </span>
                    <span className="country-code">+91</span>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      pattern="[6-9][0-9]{9}"
                      title="Enter a valid 10-digit Indian mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>

                  <div className="input-group custom-input">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      className="input-group-text password-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-end mb-4">
                  <a href="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </a>
                </div>

                <button type="submit" className="btn login-button w-100" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login to Your Account"}
                </button>

                <div className="divider">
                  <span>NEW TO CAREERPATH?</span>
                </div>

                <Link to="/register" className="btn register-button w-100">
                  <FaUserPlus className="me-2" />
                  Create a New Account
                </Link>
              </form>

              <p className="privacy-note">
                By continuing, you agree to our{" "}
                <a href="/terms">Terms</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>

        <footer className="login-footer">
          © {new Date().getFullYear()} CareerPath. Empowering students
          to build their future.
        </footer>
      </main>
    </div>
  );
}

export default Login;
