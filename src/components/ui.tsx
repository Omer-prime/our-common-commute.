"use client";

import React, {
  InputHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
  useState,
} from "react";
import clsx from "clsx";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c7 0 10 7 10 7s-3 7-10 7S2 12 2 12s3-7 10-7Zm0 2C7 7 4.7 11 4.1 12c.6 1 2.9 5 7.9 5s7.3-4 7.9-5c-.6-1-2.9-5-7.9-5Zm0 2.5A2.5 2.5 0 1 1 9.5 12A2.5 2.5 0 0 1 12 9.5Z"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2.1 3.5 3.5 2.1 22 20.6 20.6 22l-2.1-2.1c-1.9 1-4.1 1.6-6.5 1.6-7 0-10-7-10-7a18 18 0 0 1 4.1-5.2L2.1 3.5Zm9.9 3.5c7 0 10 7 10 7a18.8 18.8 0 0 1-2.2 3.2l-2.3-2.3c.3-.6.5-1.3.5-2a5 5 0 0 0-6.6-4.7L10 6.9c.6-.3 1.3-.4 2-.4Zm-5 5a5 5 0 0 0 7 4.6l-1.5-1.5a2.5 2.5 0 0 1-3.4-3.4L7 12Z"
      />
    </svg>
  );
}

export type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  leftIcon?: ReactNode;
  showPasswordToggle?: boolean; // default true for password
};

export function TextInput(props: TextInputProps) {
  const {
    label,
    className,
    leftIcon,
    showPasswordToggle,
    type,
    ...rest
  } = props;

  const isPassword = type === "password";
  const [show, setShow] = useState(false);

  const inputType = isPassword && show ? "text" : type;

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-slate-700">{label}</span>}

      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        ) : null}

        <input
          {...rest}
          type={inputType}
          className={clsx(
            "h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none",
            "placeholder:text-slate-400",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
            leftIcon && "pl-10",
            isPassword && (showPasswordToggle ?? true) && "pr-10",
            className
          )}
        />

        {isPassword && (showPasswordToggle ?? true) ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            aria-label={show ? "Hide password" : "Show password"}
          >
            <EyeIcon open={show} />
          </button>
        ) : null}
      </div>
    </label>
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

export function Button({
  variant = "primary",
  className,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-semibold h-11 transition disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
      : variant === "secondary"
      ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
      : "border border-blue-600 bg-white text-blue-600 hover:bg-blue-50";

  return <button className={clsx(base, styles, className)} {...rest} />;
}
