import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/config";
import { AuthContext } from "./AuthContext";


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                    user: data.user,
                    username: data.user.username,
                    role: data.role,
                    basicinfo: data.basicinfo,
                    hr: data.hr,
                    employee: data.employee,
                });
            } catch (err) {
                console.error("Error fetching user:", err);
                setUser(null);
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                navigate("/", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);



    const login = ({ username, role, basicinfo }) => {
        setUser({ username, role, basicinfo });
    };



    const logout = () => {
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/", { replace: true });
    };

    return (
        <AuthContext.Provider value={{ user, role: user?.role, basicinfo: user?.basicinfo, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

