import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/config";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const checkPasswordStrength = (pwd) => {
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const medium = /^.{6,}$/;
    if (strong.test(pwd)) return "strong";
    if (medium.test(pwd)) return "medium";
    return "weak";
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleConfirmChange = (e) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!password) newErrors.password = "Password is required";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/auth/reset-password/", {
        token,
        password,
      });
      setAlert({
        message: "Password reset successfully. Redirecting to login...",
        type: "success",
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setAlert({
        message:
          error.response?.data?.error ||
          error.response?.data?.detail ||
          "Failed to reset password.",
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlert({ message: "", type: "" }), 5000);
    }
  };

  return (
    <section
      className="login d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      <div className="container" style={{ maxWidth: 700 }}>
        <div
          className="card shadow"
          style={{ borderRadius: 20 }}
        >
          <div className="card-body">
            <h4 className="text-center mb-2">Reset Password</h4>
            <p className="text-center text-secondary mb-4">
              Enter your new password
            </p>

            {alert.message && (
              <div className={`alert alert-${alert.type}`} role="alert">
                {alert.message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Password Field */}
              <div className="form-floating mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  placeholder="New password"
                  value={password}
                  onChange={handlePasswordChange}
                />
                <label>New Password</label>
                <button
                  type="button"
                  className="btn position-absolute"
                  onClick={toggleShowPassword}
                  style={{ top: "50%", right: "10px", transform: "translateY(-50%)" }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password}</div>
                )}
              </div>

              {/* Password Strength */}
              {password && (
                <div
                  className={`mb-2 small fw-bold text-${
                    passwordStrength === "strong"
                      ? "success"
                      : passwordStrength === "medium"
                      ? "warning"
                      : "danger"
                  }`}
                >
                  Strength: {passwordStrength}
                </div>
              )}

              {/* Confirm Password Field */}
              <div className="form-floating mb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-control ${
                    errors.confirmPassword ? "is-invalid" : ""
                  }`}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={handleConfirmChange}
                />
                <label>Confirm Password</label>
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-dark w-100 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
