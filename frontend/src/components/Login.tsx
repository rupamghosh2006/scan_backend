import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/v1";

const Login: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${API_BASE}/students/login`,
        { mobile, password },
        { withCredentials: true }
      );

      localStorage.setItem("token", res.data?.data?.accessToken || "");

      if (mobile === "9876543210") {
        window.location.href = "/teacher";
      } else {
        window.location.href = "/student";
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-600">Login</h2>
        <input
          type="text"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Mobile"
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
        <p className="text-center mt-4">Don't have an account? <a href="/register" className="text-blue-600 underline">Register here</a></p>
      </form>
    </div>
  );
};

export default Login;