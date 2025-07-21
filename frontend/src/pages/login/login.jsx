import React from "react";
import { useEffect, useState } from "react";
import axiosInstance from '../../api/config'
import { Link } from "react-router-dom";
import './login.css'
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    document.title = "Login | HERA";
  })

  useEffect(() => {
    if (user !== null) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/auth/login/", {
        username: formData.username,
        password: formData.password,
      });
      console.log("Login response:", res.data);
      if (res.data.access && res.data.refresh) {
        localStorage.setItem("access_token", res.data.access);
        localStorage.setItem("refresh_token", res.data.refresh);
        setAlert({ message: "Logged in successfully", type: "success" });
        window.location.replace("/dashboard");
      } else {
        throw new Error("Invalid response format: access or refresh token missing");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);

      setAlert({
        message:
          error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.detail ||
          "Login failed. Please check your credentials.",
        type: "danger",
      });

      setTimeout(() => setAlert({ message: "", type: "" }), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login">
      <div className="container">
        <div
          className="card shadow my-login-card-style"
          style={{ borderRadius: 20 }}
        >
          <div className="column-1">
            <img src="/login.jpg" alt="login page image" />
          </div>

          <div className="card-body column-2">
            <h4 className="text-center mb-2">Welcome</h4>
            <p className="text-center text-secondary mb-4">
              Please login to your account
            </p>
            {alert.message && (
              <div className={`alert alert-${alert.type}`} role="alert">
                {alert.message}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-control"
                  placeholder="email"
                  required
                  onChange={handleChange}
                />
                <label htmlFor="username">email</label>
              </div>
              <div className="form-floating mb-4">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Password"
                  required
                  onChange={handleChange}
                />
                <label htmlFor="password">Password</label>
              </div>
              <div className="text-center mb-3">
                <Link to="/forgot-password" className="text-secondary">
                  Forgot Password?
                </Link>
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
                    Logging in...
                  </>

                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;