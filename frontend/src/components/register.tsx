import React, { useState } from "react";
import axios from "axios";
import dotenv from "dotenv";

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
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verified, setVerified] = useState(false);

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const expirationTimestamp = new Date();
  expirationTimestamp.setMinutes(
    expirationTimestamp.getMinutes() + 10
  );

  const sendMessageURL = `https://graph.facebook.com/${process.env.META_API_V}/${process.env.WP_BUSINESS_NO}/messages`;
  
  const sendOtp = async () => {
  const otp = generateOtp();
  setGeneratedOtp(otp);
  setShowOtpInput(true);

  try {
    await axios.post(`${API_BASE}/otp/send`, { otp, mobile: form.mobile }, config);
  } catch (err) {
    alert("Failed to send OTP");
  }
};

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setVerified(true);
      setShowOtpInput(false);
    } else {
      alert("Incorrect OTP");
    }
  };

  const handleEditRequest = () => {
    if (confirm("Edit verified mobile number?")) {
      setVerified(false);
      setOtp("");
    }
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
    <div className="bg-gray-100 flex items-center justify-center min-h-screen">
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
          <div className="flex items-center gap-2">
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile"
              value={form.mobile}
              onChange={handleChange}
              className={`${inputClass("mobile")} ${verified ? "border-green-500" : ""}`}
              max={10}
              required
              disabled={verified}
            />
            {!verified && (
              <button
                type="button"
                className="bg-blue-500 text-white px-3 py-2 rounded shrink-0"
                onClick={sendOtp}
              >
                Send OTP
              </button>
            )}
          </div>

          {showOtpInput && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border border-gray-300 px-2 py-1 rounded w-full"
              />
              <button
                type="button"
                className="bg-green-500 text-white px-3 py-1 rounded"
                onClick={verifyOtp}
              >
                Verify
              </button>
            </div>
          )}

          {verified && (
            <div className="text-green-600 text-sm mt-1">
              ✅ Verified: {form.mobile}{" "}
              <button
                type="button"
                className="text-blue-600 underline ml-2"
                onClick={handleEditRequest}
              >
                Edit?
              </button>
            </div>
          )}
          {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
        </div>

        <div>
          <input
            type="number"
            name="class_No"
            placeholder="Class (11/12)"
            className={inputClass("class_No")}
            max={2}
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
            max={10}
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
