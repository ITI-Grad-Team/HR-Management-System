import React, { useState } from "react";
import axiosInstance from "../../api/config";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setPasswordStrength(checkPasswordStrength(e.target.value));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const checkPasswordStrength = (pwd) => {
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    const medium = /^.{6,}$/;
    if (strong.test(pwd)) return "strong";
    if (medium.test(pwd)) return "medium";
    return "weak";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!form.oldPassword) newErrors.oldPassword = "Current password required";
    if (!form.newPassword) newErrors.newPassword = "New password required";
    if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post("/change-password/", {
        old_password: form.oldPassword,
        new_password: form.newPassword,
      });

      toast.success("Password changed successfully.");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);

    } catch (error) {
      toast.error(
  error.response?.data?.detail ||
  error.response?.data?.error ||
  "Failed to change password."
);

    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container py-5" style={{ maxWidth: 500 }}>
      <div className="card shadow-sm rounded-3 p-4">
        <h4 className="mb-3 text-center">Change Password</h4>

        <form onSubmit={handleSubmit}>
          {/* Old Password */}
          <div className="form-floating mb-3">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${
                errors.oldPassword ? "is-invalid" : ""
              }`}
              placeholder="Current Password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
            />
            <label>Current Password</label>
            {errors.oldPassword && (
              <div className="invalid-feedback">{errors.oldPassword}</div>
            )}
          </div>

          {/* New Password */}
          <div className="form-floating mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${
                errors.newPassword ? "is-invalid" : ""
              }`}
              placeholder="New Password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
            />
            <label>New Password</label>
            <button
              type="button"
              className="btn position-absolute"
              onClick={toggleShowPassword}
              style={{ top: "50%", right: 10, transform: "translateY(-50%)" }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.newPassword && (
              <div className="invalid-feedback">{errors.newPassword}</div>
            )}
          </div>

                        {/* Password Strength */}
              {form.newPassword && (
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

          {/* Confirm Password */}
          <div className="form-floating mb-3">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control ${
                errors.confirmPassword ? "is-invalid" : ""
              }`}
              placeholder="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <label>Confirm Password</label>
            {errors.confirmPassword && (
              <div className="invalid-feedback">{errors.confirmPassword}</div>
            )}
          </div>
          <div className="text-center mb-3">
                <Link to="/forgot-password" className="text-secondary">
                  Forgot Password?
                </Link>
              </div>

          <button
            type="submit"
            className="btn btn-dark w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChangePassword;
