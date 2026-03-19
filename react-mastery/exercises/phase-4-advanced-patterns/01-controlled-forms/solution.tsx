import React, { useState, FormEvent, ChangeEvent } from "react";

// ============================================================
// Solution: Controlled Forms — Full Registration Form
// ============================================================

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  agreeToTerms: boolean;
  notificationPref: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  agreeToTerms?: string;
  notificationPref?: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  password: "",
  role: "",
  agreeToTerms: false,
  notificationPref: "none",
};

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!data.email.includes("@")) {
    errors.email = "Email must contain '@'.";
  }

  if (!data.password) {
    errors.password = "Password is required.";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!data.role) {
    errors.role = "Please select a role.";
  }

  if (!data.agreeToTerms) {
    errors.agreeToTerms = "You must agree to the terms.";
  }

  return errors;
}

const errorStyle: React.CSSProperties = { color: "red", fontSize: "0.85em" };
const fieldStyle: React.CSSProperties = { marginBottom: "12px" };

export function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement;
    const { name, type, value } = target;
    const checked = target.checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSuccessMessage(
        `Registration successful! Welcome, ${formData.name}.`
      );
    } else {
      setSuccessMessage("");
    }
  }

  function handleReset() {
    setFormData(initialFormData);
    setErrors({});
    setSuccessMessage("");
  }

  return (
    <div>
      <h1>Exercise: Controlled Forms</h1>

      {successMessage && (
        <p style={{ color: "green", fontWeight: "bold" }}>{successMessage}</p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div style={fieldStyle}>
          <label htmlFor="name">Name: </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span style={errorStyle}> {errors.name}</span>}
        </div>

        {/* Email */}
        <div style={fieldStyle}>
          <label htmlFor="email">Email: </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <span style={errorStyle}> {errors.email}</span>}
        </div>

        {/* Password */}
        <div style={fieldStyle}>
          <label htmlFor="password">Password: </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && (
            <span style={errorStyle}> {errors.password}</span>
          )}
        </div>

        {/* Role Select */}
        <div style={fieldStyle}>
          <label htmlFor="role">Role: </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="">Select a role</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
          </select>
          {errors.role && <span style={errorStyle}> {errors.role}</span>}
        </div>

        {/* Agree to Terms Checkbox */}
        <div style={fieldStyle}>
          <label>
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />{" "}
            I agree to the terms
          </label>
          {errors.agreeToTerms && (
            <span style={errorStyle}> {errors.agreeToTerms}</span>
          )}
        </div>

        {/* Notification Preference Radio Buttons */}
        <div style={fieldStyle}>
          <p style={{ margin: "0 0 4px 0" }}>Notification preference:</p>
          <label>
            <input
              type="radio"
              name="notificationPref"
              value="email"
              checked={formData.notificationPref === "email"}
              onChange={handleChange}
            />{" "}
            Email
          </label>
          <label style={{ marginLeft: "12px" }}>
            <input
              type="radio"
              name="notificationPref"
              value="sms"
              checked={formData.notificationPref === "sms"}
              onChange={handleChange}
            />{" "}
            SMS
          </label>
          <label style={{ marginLeft: "12px" }}>
            <input
              type="radio"
              name="notificationPref"
              value="none"
              checked={formData.notificationPref === "none"}
              onChange={handleChange}
            />{" "}
            None
          </label>
        </div>

        {/* Submit and Reset */}
        <div style={{ marginTop: "16px" }}>
          <button type="submit">Register</button>
          <button
            type="button"
            onClick={handleReset}
            style={{ marginLeft: "8px" }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
