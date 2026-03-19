import React, { useReducer } from "react";

// =============================================================
// SOLUTION 8: Multi-Step Form with useReducer + Validation
// =============================================================

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormState {
  step: number;
  data: FormData;
  errors: FormErrors;
  submitted: boolean;
}

type FormAction =
  | { type: "UPDATE_FIELD"; field: keyof FormData; value: string }
  | { type: "SET_ERRORS"; errors: FormErrors }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SUBMIT" };

// TODO 1 ✅ — initial state
const initialState: FormState = {
  step: 1,
  data: {
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  },
  errors: {},
  submitted: false,
};

// TODO 2 ✅ — reducer
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        // Clear that specific field's error as the user types
        errors: { ...state.errors, [action.field]: undefined },
      };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "NEXT_STEP":
      return { ...state, step: state.step + 1, errors: {} };
    case "PREV_STEP":
      return { ...state, step: state.step - 1, errors: {} };
    case "SUBMIT":
      return { ...state, submitted: true };
    default:
      return state;
  }
}

// TODO 3 ✅ — validation
function validate(step: number, data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (step === 1) {
    if (!data.firstName.trim()) errors.firstName = "First name is required";
    if (!data.lastName.trim()) errors.lastName = "Last name is required";
    if (!data.email.trim() || !data.email.includes("@"))
      errors.email = "Valid email required";
  }

  if (step === 2) {
    if (data.username.trim().length < 3)
      errors.username = "Min 3 characters";
    if (data.password.length < 8)
      errors.password = "Min 8 characters";
    if (data.confirmPassword !== data.password)
      errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

// TODO 4 ✅ — handleNext
function handleNext(
  step: number,
  data: FormData,
  dispatch: React.Dispatch<FormAction>
) {
  const errors = validate(step, data);
  if (Object.keys(errors).length > 0) {
    dispatch({ type: "SET_ERRORS", errors });
  } else {
    dispatch({ type: "NEXT_STEP" });
  }
}

export function App() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { step, data, errors, submitted } = state;

  const update = (field: keyof FormData) => (value: string) =>
    dispatch({ type: "UPDATE_FIELD", field, value });

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.success}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h2 style={{ margin: "12px 0 6px" }}>Registration Complete!</h2>
          <p style={{ color: "#6b7280" }}>Welcome, {data.firstName}!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Create Account</h1>

      {/* --- STEP INDICATOR --- */}
      <div style={styles.stepIndicator}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={styles.stepRow}>
            <div
              style={{
                ...styles.stepDot,
                background: step >= s ? "#4f46e5" : "#e5e7eb",
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                style={{
                  ...styles.stepLine,
                  background: step > s ? "#4f46e5" : "#e5e7eb",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p style={styles.stepLabel}>Step {step} of 3</p>

      {/* --- STEP 1 --- */}
      {step === 1 && (
        <div style={styles.form}>
          <h2 style={styles.stepTitle}>Personal Info</h2>
          <FormField
            label="First Name"
            value={data.firstName}
            onChange={update("firstName")}
            error={errors.firstName}
            placeholder="John"
          />
          <FormField
            label="Last Name"
            value={data.lastName}
            onChange={update("lastName")}
            error={errors.lastName}
            placeholder="Doe"
          />
          <FormField
            label="Email"
            type="email"
            value={data.email}
            onChange={update("email")}
            error={errors.email}
            placeholder="john@example.com"
          />
        </div>
      )}

      {/* --- STEP 2 --- */}
      {step === 2 && (
        <div style={styles.form}>
          <h2 style={styles.stepTitle}>Account Setup</h2>
          <FormField
            label="Username"
            value={data.username}
            onChange={update("username")}
            error={errors.username}
            placeholder="johndoe123"
          />
          <FormField
            label="Password"
            type="password"
            value={data.password}
            onChange={update("password")}
            error={errors.password}
            placeholder="Min 8 characters"
          />
          <FormField
            label="Confirm Password"
            type="password"
            value={data.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
            placeholder="Repeat password"
          />
        </div>
      )}

      {/* --- STEP 3: REVIEW --- */}
      {step === 3 && (
        <div style={styles.form}>
          <h2 style={styles.stepTitle}>Review & Submit</h2>
          {[
            ["First Name", data.firstName],
            ["Last Name", data.lastName],
            ["Email", data.email],
            ["Username", data.username],
            ["Password", "••••••••"],
          ].map(([label, value]) => (
            <div key={label} style={styles.summaryRow}>
              <span style={styles.summaryLabel}>{label}</span>
              <span style={styles.summaryValue}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* --- NAVIGATION BUTTONS --- */}
      <div style={styles.btnRow}>
        {step > 1 && (
          <button
            style={styles.backBtn}
            onClick={() => dispatch({ type: "PREV_STEP" })}
          >
            Back
          </button>
        )}
        {step < 3 && (
          <button
            style={styles.nextBtn}
            onClick={() => handleNext(step, data, dispatch)}
          >
            Next →
          </button>
        )}
        {step === 3 && (
          <button
            style={{ ...styles.nextBtn, background: "#22c55e" }}
            onClick={() => dispatch({ type: "SUBMIT" })}
          >
            Submit ✓
          </button>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...styles.input,
          borderColor: error ? "#ef4444" : "#d1d5db",
          outline: error ? "2px solid #fca5a5" : undefined,
        }}
      />
      {error && <p style={styles.errorMsg}>{error}</p>}
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. useReducer shines for multi-step forms:
//    - All form data lives in one state object
//    - Actions clearly describe what changed (UPDATE_FIELD, NEXT_STEP, etc.)
//    - Easy to reset or go back — just dispatch PREV_STEP
//
// 2. Validation pattern:
//    - validate() returns errors object (empty = no errors)
//    - On "Next": validate first, then either show errors or advance
//    - Clear field errors as user types (in UPDATE_FIELD)
//
// 3. [action.field]: action.value  — computed property name
//    - Allows one action to update any field dynamically
//    - Without it you'd need a separate action for each field
//
// 4. Derived update helper: const update = (field) => (value) => dispatch(...)
//    - Makes JSX cleaner: onChange={update("firstName")}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 460, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" },
  title: { textAlign: "center", fontSize: 24, marginBottom: 24 },
  stepIndicator: { display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 4 },
  stepRow: { display: "flex", alignItems: "center" },
  stepDot: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 14 },
  stepLine: { width: 60, height: 3, margin: "0 4px" },
  stepLabel: { textAlign: "center", color: "#6b7280", fontSize: 13, marginBottom: 24 },
  form: { background: "#f9fafb", borderRadius: 12, padding: "24px", marginBottom: 20, border: "1px solid #e5e7eb" },
  stepTitle: { margin: "0 0 20px", fontSize: 18, color: "#111827" },
  label: { display: "block", marginBottom: 6, fontSize: 14, fontWeight: "bold", color: "#374151" },
  input: { width: "100%", padding: "9px 12px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box" },
  errorMsg: { color: "#ef4444", fontSize: 12, margin: "4px 0 0" },
  btnRow: { display: "flex", gap: 10, justifyContent: "flex-end" },
  backBtn: { padding: "10px 20px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 15 },
  nextBtn: { padding: "10px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: "bold" },
  success: { textAlign: "center", padding: "60px 20px", color: "#111827" },
  summaryRow: { display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #e5e7eb", fontSize: 14 },
  summaryLabel: { color: "#6b7280", minWidth: 130 },
  summaryValue: { color: "#111827", fontWeight: "bold" },
};
