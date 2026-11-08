import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaGraduationCap,
  FaLock,
  FaPhoneAlt,
  FaUserPlus,
} from "react-icons/fa";
import { getApiErrorMessage, registerStudent } from "../api/auth";
import { useNotification } from "../components/useNotification";
import "./Login.css";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const isValidPassword = Object.values(passwordRules).every(Boolean);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleGenerateOtp = () => {
    if (!isValidPhone) {
      notify({ title: "Check your mobile number", message: "Enter a valid 10-digit Indian mobile number first.", type: "warning" });
      return;
    }

    setDemoOtp(String(Math.floor(100000 + Math.random() * 900000)));
    setOtp("");
    setIsVerified(false);
    notify({ title: "Demo OTP generated", message: "Use the code displayed on the form to verify your mobile number.", type: "info" });
  };

  const handleVerifyOtp = () => {
    if (!demoOtp) {
      notify({ title: "Generate an OTP first", message: "Generate a demo OTP before verifying.", type: "warning" });
      return;
    }

    if (otp !== demoOtp) {
      setIsVerified(false);
      notify({ title: "OTP doesn't match", message: "Please check the displayed demo code and try again.", type: "error" });
      return;
    }

    setIsVerified(true);
    notify({ title: "Mobile number verified", message: "You can now create your account.", type: "success" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValidPassword) {
      notify({ title: "Password requirements", message: "Create a password that meets all the requirements.", type: "warning" });
      return;
    }

    if (!passwordsMatch) {
      notify({ title: "Passwords don't match", message: "Please re-enter your password.", type: "warning" });
      return;
    }

    if (!isValidPhone) {
      notify({ title: "Check your mobile number", message: "Enter a valid 10-digit Indian mobile number.", type: "warning" });
      return;
    }

    if (!isVerified) {
      notify({ title: "Verify your mobile number", message: "Generate and verify the OTP before creating your account.", type: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStudent({ fullName: name.trim(), phone, password });
      navigate("/login", {
        state: {
          notification: {
            title: "Account created",
            message: "Your account is ready. You can now log in.",
            type: "success",
          },
        },
      });
    } catch (error) {
      notify({ title: "Registration failed", message: getApiErrorMessage(error, "Unable to create your account. Please try again."), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <main className="container login-container">
        <section className="registration-card">
          <div className="form-heading-icon">
            <FaGraduationCap />
          </div>
          <p className="form-welcome">GET STARTED</p>
          <h1>Create your account</h1>
          <p className="form-description">
            Register with your mobile number and verify it using a demo OTP.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="register-name" className="form-label">
                Full Name
              </label>
              <input
                id="register-name"
                name="name"
                className="form-control registration-input"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="register-phone" className="form-label">
                Mobile Number
              </label>
              <div className="input-group custom-input">
                <span className="input-group-text"><FaPhoneAlt /></span>
                <span className="country-code">+91</span>
                <input
                  id="register-phone"
                  name="phone"
                  className="form-control"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                    setDemoOtp("");
                    setOtp("");
                    setIsVerified(false);
                  }}
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[6-9][0-9]{9}"
                  title="Enter a valid 10-digit Indian mobile number"
                  required
                />
              </div>
              {phone.length > 0 && !isValidPhone && (
                <small className="registration-hint" role="alert">
                  Enter a valid 10-digit Indian mobile number.
                </small>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="register-password" className="form-label">
                Password
              </label>
              <div className="input-group custom-input">
                <span className="input-group-text"><FaLock /></span>
                <input
                  id="register-password"
                  name="password"
                  className="form-control"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                  autoComplete="new-password"
                  aria-describedby="password-requirements"
                  required
                />
                <button
                  className="input-group-text password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <ul className="password-requirements" id="password-requirements">
                <li className={passwordRules.length ? "requirement-met" : ""}>
                  At least 8 characters
                </li>
                <li className={passwordRules.uppercase ? "requirement-met" : ""}>
                  One uppercase letter
                </li>
                <li className={passwordRules.lowercase ? "requirement-met" : ""}>
                  One lowercase letter
                </li>
                <li className={passwordRules.number ? "requirement-met" : ""}>
                  One number
                </li>
              </ul>
            </div>

            <div className="mb-3">
              <label htmlFor="register-confirm-password" className="form-label">
                Re-enter Password
              </label>
              <div className="input-group custom-input">
                <span className="input-group-text"><FaLock /></span>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  className="form-control"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                  }}
                  autoComplete="new-password"
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                  required
                />
                <button
                  className="input-group-text password-toggle"
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((visible) => !visible)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide re-entered password"
                      : "Show re-entered password"
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <small
                  className={`registration-hint${passwordsMatch ? " is-valid" : ""}`}
                  role="status"
                >
                  {passwordsMatch
                    ? "Passwords match."
                    : "Passwords do not match."}
                </small>
              )}
            </div>

            <button
              className="btn login-button w-100 mb-3"
              type="button"
              onClick={handleGenerateOtp}
            >
              Generate Demo OTP
            </button>

            {demoOtp && (
              <div className="demo-otp" aria-live="polite">
                Demo OTP: <strong>{demoOtp}</strong>
                <span>This code is displayed for testing only.</span>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="register-otp" className="form-label">
                One-Time Password
              </label>
              <div className="registration-otp-row">
                <input
                  id="register-otp"
                  name="otp"
                  className="form-control registration-input"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setIsVerified(false);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
                <button
                  className="btn register-button"
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || !demoOtp}
                >
                  Verify
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn login-button w-100"
              disabled={!isVerified || isSubmitting}
            >
              <FaUserPlus className="me-2" />
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="registration-login">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          <p className="privacy-note">
            Demo only: this OTP is generated in your browser and is not sent by SMS.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Register;
