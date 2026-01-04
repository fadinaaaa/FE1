import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./LoginForm.css";

const LoginPage = () => {
  const navigate = useNavigate();

  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Untuk status loading
  const [errorMessage, setErrorMessage] = useState(""); // Untuk pesan error

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset error saat user mulai mengetik ulang
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 1. Mengirim Request ke Backend
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // 2. Cek apakah response sukses (Status code 200-299)
      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            "Login gagal, periksa username/password."
        );
      }

      // 3. Login Berhasil
      console.log("Login Success:", data);

      // --- PENYIMPANAN DATA SESI ---

      // --- PENYIMPANAN DATA SESI ---

      // Token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Username
      if (data.user?.username) {
        localStorage.setItem("username", data.user.username);
      } else {
        localStorage.setItem("username", formData.username);
      }

      // Role
      if (data.user?.role) {
        localStorage.setItem("role", data.user.role);
      }

      // -----------------------------

      // 4. Redirect ke Dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ttmt-login-container">
      <div className="ttmt-login-card">
        {/* Header Section */}
        <div className="ttmt-login-header">
          <h1 className="ttmt-login-title">PT TTMT</h1>
          <p className="ttmt-login-subtitle">Please login to your account</p>
        </div>

        {/* Tampilkan Pesan Error jika ada */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form Section */}
        {/* Tambahkan autoComplete="off" agar browser tidak otomatis mengisi form saat development */}
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Username Input */}
          <div className="ttmt-login-group">
            <label htmlFor="username" className="ttmt-login-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              className="ttmt-login-input"
              required
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          {/* Password Input */}
          <div className="ttmt-login-group">
            <label htmlFor="password" className="ttmt-login-label">
              Password
            </label>
            <div className="ttmt-login-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="ttmt-login-input"
                style={{ paddingRight: "3rem" }}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ttmt-login-toggle-btn"
                disabled={isLoading}
                style={{
                  background: "none",
                  border: "none",
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="ttmt-login-submit-btn"
            disabled={isLoading}
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "wait" : "pointer",
            }}
          >
            {isLoading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
