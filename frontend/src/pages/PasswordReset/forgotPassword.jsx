import React, { useState } from "react";
import axiosInstance from "../../api/config";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/auth/forgot-password/", { email });
      setAlert({ message: "Reset link sent! Please check your email.", type: "success" });
      setEmail("");
    } catch (error) {
      console.error("Reset error:", error.response?.data || error.message);
      setAlert({
        message:
          error.response?.data?.error ||
          error.response?.data?.detail ||
          "Failed to send reset link.",
        type: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlert({ message: "", type: "" }), 5000);
    }
  };

  return (
    <section className="login d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="container justify-content-center w-50">
        <div className="card shadow my-login-card-style" style={{ borderRadius: 20 }}>
          <div className="card-body column-2 w-100">
            <h4 className="text-center mb-2">Forgot Password?</h4>
            <p className="text-center text-secondary mb-4">
              Enter your email and we'll send you a reset link
            </p>
            {alert.message && (
              <div className={`alert alert-${alert.type}`} role="alert">
                {alert.message}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label>Email address</label>
              </div>
              <button type="submit" className="btn btn-dark w-100 mb-3" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
              <div className="text-center">
                <Link to="/" className="text-secondary">
                  <FaArrowLeft /> Back
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
