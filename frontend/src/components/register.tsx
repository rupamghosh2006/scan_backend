import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/v1";

const validateForm = (form: any) => {
  const errors: Record<string, string> = {};

  if (form.mobile.length !== 10) errors.mobile = "Mobile number must be 10 digits";
  if (form.guardianMobile.length !== 10) errors.guardianMobile = "Guardian number must be 10 digits";
  if (form.mobile === form.guardianMobile) errors.guardianMobile = "Guardian and student numbers must be different";
  if (!["11", "12"].includes(form.class_No)) errors.class_No = "Class must be 11 or 12";
  if (form.password.length < 6) errors.password = "Password must be at least 6 characters";
  if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";

  return errors;
};

const Registert: React.FC = () => {
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    class_No: "",
    guardianName: "",
    guardianMobile: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear individual field error
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/students/register`, form, config);
      alert(res.data.message);
      if (res.status === 201) window.location.href = "/";
    } catch (err: any) {
      alert(err?.response?.data?.message || "Registration failed");
    }
  };

  const inputClass = (field: string) =>
    `w-full p-2 border rounded ${errors[field] ? "border-red-500" : "border-gray-300"}`;

  return (
    <div className="bg-cyan-100 flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Student Registration
        </h2>
        <div>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className={inputClass("fullName")}
            required
            onChange={handleChange}
          />
          {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
        </div>
        <div>
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile"
            className={inputClass("mobile")}
            required
            onChange={handleChange}
          />
          {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
        </div>
        <div>
          <input
            type="number"
            name="class_No"
            placeholder="Class (11/12)"
            className={inputClass("class_No")}
            required
            onChange={handleChange}
          />
          {errors.class_No && <p className="text-red-500 text-sm">{errors.class_No}</p>}
        </div>
        <div>
          <input
            type="text"
            name="guardianName"
            placeholder="Guardian Name"
            className={inputClass("guardianName")}
            required
            onChange={handleChange}
          />
          {errors.guardianName && <p className="text-red-500 text-sm">{errors.guardianName}</p>}
        </div>
        <div>
          <input
            type="tel"
            name="guardianMobile"
            placeholder="Guardian Mobile"
            className={inputClass("guardianMobile")}
            required
            onChange={handleChange}
          />
          {errors.guardianMobile && <p className="text-red-500 text-sm">{errors.guardianMobile}</p>}
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={inputClass("password")}
            required
            onChange={handleChange}
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>
        <div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className={inputClass("confirmPassword")}
            required
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
        <p className="text-center mt-4">
          Already have an account?{" "}
          <a href="/" className="text-blue-600 underline">
            Login here
          </a>
        </p>
      </form>
    </div>
  );
};

export default Registert;
