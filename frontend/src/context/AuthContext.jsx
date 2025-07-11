// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/config";

// 1. إنشاء الـ Context
const AuthContext = createContext();
// 2. Hook مخصص عشان تسهّل الاستخدام
export const useAuth = () => useContext(AuthContext);

// 3. Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // {username, role, ...}
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  // 4. تحميل بيانات المستخدم من localStorage أو من API


    useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get("/view-self/");
        console.log("Fetched user:", res.data);
        const data = res.data;
        setUser({
          username: data.user.username,
          role: data.role,
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);



const login = ({ username, role }) => {
    setUser({ username, role });
  };



  const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

