"use client";

import { useState } from "react";


interface FieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  error?: string;
}

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
  minLength,
  error,
}: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <label className="block text-sm font-medium text-stone-700">
      {label}

      <div className="relative mt-2">
        <input
          className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition ${
            isPassword ? "pr-12" : ""
          } ${
            error
              ? "border-red-500 text-red-900 focus:border-red-600 focus:ring-2 focus:ring-red-100"
              : "border-stone-300 focus:border-amber-800 focus:ring-2 focus:ring-amber-100"
          }`}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
            aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          >
            {showPassword ? (
              // Eye off
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 4.2A10.5 10.5 0 0112 4c5.5 0 9 8 9 8a16 16 0 01-2.1 3.2" />
                <path d="M6.6 6.6C4.4 8.1 3 12 3 12s3.5 8 9 8a9.8 9.8 0 004.1-.9" />
              </svg>
            ) : (
              // Eye
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error ? (
        <span
          id={`${name}-error`}
          className="mt-2 block text-sm font-medium text-red-600"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}
