// register.tsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/v1"; // Backend base URL

const Registert: React.FC = () => {
  // Form state
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    class_No: "",
    guardianName: "",
    guardianMobile: "",
    password: "",
    confirmPassword: "",
  });

  let config = {
      headers: {
        "Content-Type": "application/json", 
    },
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit registration form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/students/register`, form, config);
      alert(res.data.message);
      if (res.status === 200) window.location.href = "/login";
    } catch (err: any) {
      alert(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Student Registration
        </h2>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <input
          type="number"
          name="class_No"
          placeholder="Class (11/12)"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <input
          type="text"
          name="guardianName"
          placeholder="Guardian Name"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <input
          type="text"
          name="guardianMobile"
          placeholder="Guardian Mobile"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="w-full p-2 border rounded"
          required
          onChange={handleChange}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
        <p className="text-center mt-4">Already have an account? <a href="/" className="text-blue-600 underline">Login here</a></p>
      </form>
    </div>
  );
};

export default Registert;