import React, { useReducer } from "react";

// =============================================================
// EXERCISE 8: Multi-Step Form with useReducer + Validation
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - useReducer for complex form state
//   - Multi-step form navigation (next/back)
//   - Form validation before allowing the next step
//   - Displaying a summary/confirmation at the end
//
// GOAL: Build a 3-step registration form:
//
//   Step 1 — Personal Info:
//     - First name (required)
//     - Last name (required)
//     - Email (required, must contain @)
//
//   Step 2 — Account Setup:
//     - Username (required, min 3 characters)
//     - Password (required, min 8 characters)
//     - Confirm Password (must match password)
//
//   Step 3 — Review & Submit:
//     - Show all entered info (not the password — just a masked "••••••••")
//     - Submit button
//     - Success message after submit
//
// STEP INDICATOR: Show "Step 1 of 3", "Step 2 of 3", etc.
// VALIDATION: Show error messages inline under each field
// =============================================================

// --- Types (do not change) ---
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
  step: number;          // 1, 2, or 3
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

// =============================================================
// TODO 1: Write the initialState
//   step: 1
//   data: all empty strings
//   errors: {}
//   submitted: false
// =============================================================

// =============================================================
// TODO 2: Write formReducer(state, action)
//
//   UPDATE_FIELD: update state.data[field] = value, clear that field's error
//   SET_ERRORS:   set state.errors = action.errors
//   NEXT_STEP:    step + 1, clear errors
//   PREV_STEP:    step - 1, clear errors
//   SUBMIT:       submitted = true
// =============================================================

// =============================================================
// TODO 3: Write validate(step, data): FormErrors
//   Returns an errors object. Empty object = valid.
//
//   Step 1 validation:
//     - firstName: required ("First name is required")
//     - lastName:  required ("Last name is required")
//     - email:     required AND must include "@" ("Valid email required")
//
//   Step 2 validation:
//     - username:        required, length >= 3 ("Min 3 characters")
//     - password:        required, length >= 8 ("Min 8 characters")
//     - confirmPassword: must === password ("Passwords do not match")
// =============================================================

// =============================================================
// TODO 4: Write handleNext(step, data, dispatch)
//   - Call validate(step, data)
//   - If errors exist: dispatch SET_ERRORS
//   - If no errors: dispatch NEXT_STEP
// =============================================================

export function App() {
  // TODO: call useReducer here

  // TODO: call handleNext in the "Next" button

  if (/* submitted */ false) {
    return (
      <div style={styles.container}>
        <div style={styles.success}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2>Registration Complete!</h2>
          <p>Welcome, {/* state.data.firstName */}!</p>
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
                background: /* step >= s ? "#4f46e5" : */ "#e5e7eb",
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                style={{
                  ...styles.stepLine,
                  background: /* step > s ? "#4f46e5" : */ "#e5e7eb",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p style={styles.stepLabel}>Step {/* step */} of 3</p>

      {/* --- STEP 1: PERSONAL INFO --- */}
      {/* TODO: show when step === 1 */}
      {false && (
        <div style={styles.form}>
          <h2 style={styles.stepTitle}>Personal Info</h2>
          {/* TODO: firstName, lastName, email fields with error messages */}
        </div>
      )}

      {/* --- STEP 2: ACCOUNT SETUP --- */}
      {/* TODO: show when step === 2 */}
      {false && (
        <div style={styles.form}>
          <h2 style={styles.stepTitle}>Account Setup</h2>
          {/* TODO: username, password, confirmPassword fields */}
        </div>
      )}

      {/* --- STEP 3: REVIEW --- */}
      {/* TODO: show when step === 3 */}
      {false && (
        <div style={styles.form}>
          <h2 style={styles.stepTitle}>Review & Submit</h2>
          {/* TODO: display all form data in a summary table */}
        </div>
      )}

      {/* --- NAVIGATION BUTTONS --- */}
      <div style={styles.btnRow}>
        {/* TODO: show Back button when step > 1 */}
        {/* TODO: show Next button for steps 1 and 2 */}
        {/* TODO: show Submit button on step 3 */}
      </div>
    </div>
  );
}

// --- FormField helper component (already built for you) ---
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
        }}
      />
      {error && <p style={styles.errorMsg}>{error}</p>}
    </div>
  );
}

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
