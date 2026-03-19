import React, { useState, FormEvent, ChangeEvent } from "react";

// ============================================================
// Exercise: Controlled Forms — Full Registration Form
// ============================================================
// Controlled components keep form data in React state, making
// it the "single source of truth." Every keystroke updates
// state, and state drives what the inputs display.
//
// Instructions:
// 1. Create a form state object holding name, email, password,
//    role (select), agreeToTerms (checkbox), and
//    notificationPref (radio: "email" | "sms" | "none").
// 2. Build controlled inputs for each field.
// 3. Validate on submit: all text fields required, email must
//    contain "@", password >= 6 chars, terms must be agreed.
// 4. Display validation errors next to each field.
// 5. Show a success message after a valid submission.
// 6. Implement a Reset button that clears all fields and
//    errors.
// ============================================================

// TODO 1: Define a TypeScript interface for the form data
// interface FormData {
//   name: string;
//   email: string;
//   password: string;
//   role: string;
//   agreeToTerms: boolean;
//   notificationPref: string;
// }

// TODO 2: Define a TypeScript interface for form errors
// Each field can have an optional error string.
// interface FormErrors {
//   name?: string;
//   email?: string;
//   password?: string;
//   role?: string;
//   agreeToTerms?: string;
//   notificationPref?: string;
// }

// TODO 3: Define the initial/default form data values
// const initialFormData: FormData = { ... };

// TODO 4: Create a validate function
// Takes FormData, returns FormErrors. Rules:
// - name: required
// - email: required and must contain "@"
// - password: required and length >= 6
// - role: must not be the empty placeholder value
// - agreeToTerms: must be true
// function validate(data: FormData): FormErrors { ... }

export function App() {
  // TODO 5: Create state for formData (use initialFormData)
  // const [formData, setFormData] = useState<FormData>(initialFormData);

  // TODO 6: Create state for errors (FormErrors, initially {})
  // const [errors, setErrors] = useState<FormErrors>({});

  // TODO 7: Create state for a success message (string, initially "")
  // const [successMessage, setSuccessMessage] = useState("");

  // TODO 8: Create a handleChange function
  // It should handle text inputs, selects, checkboxes, and
  // radio buttons from a single handler using e.target.name,
  // e.target.type, e.target.value, and e.target.checked.
  // function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) { ... }

  // TODO 9: Create a handleSubmit function
  // - Prevent default form submission
  // - Run validate() and set errors
  // - If no errors, set the success message with the user's name
  // - If there are errors, clear the success message
  // function handleSubmit(e: FormEvent) { ... }

  // TODO 10: Create a handleReset function
  // - Reset formData to initialFormData
  // - Clear errors and success message
  // function handleReset() { ... }

  return (
    <div>
      <h1>Exercise: Controlled Forms</h1>

      {/* TODO 11: Show successMessage in a <p> if it exists */}

      <form /* TODO 12: attach onSubmit={handleSubmit} */>
        {/* TODO 13: Controlled text input for "name"
            - <label> with htmlFor="name"
            - <input type="text" id="name" name="name"
                     value={formData.name} onChange={handleChange} />
            - Show errors.name in a <span style={{ color: "red" }}> */}

        {/* TODO 14: Controlled email input for "email"
            - Same pattern as above with type="email" */}

        {/* TODO 15: Controlled password input for "password"
            - Same pattern with type="password" */}

        {/* TODO 16: Controlled <select> for "role"
            - Options: "" (placeholder "Select a role"),
              "developer", "designer", "manager"
            - Show errors.role */}

        {/* TODO 17: Controlled checkbox for "agreeToTerms"
            - <input type="checkbox" name="agreeToTerms"
                     checked={formData.agreeToTerms}
                     onChange={handleChange} />
            - Label: "I agree to the terms"
            - Show errors.agreeToTerms */}

        {/* TODO 18: Controlled radio buttons for "notificationPref"
            - Three radios: "email", "sms", "none"
            - Each: <input type="radio" name="notificationPref"
                           value="email" checked={formData.notificationPref === "email"}
                           onChange={handleChange} />
            - Show errors.notificationPref */}

        {/* TODO 19: Submit and Reset buttons
            - <button type="submit">Register</button>
            - <button type="button" onClick={handleReset}>Reset</button> */}
      </form>
    </div>
  );
}
