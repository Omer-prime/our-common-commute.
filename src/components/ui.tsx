// src/components/ui.tsx (or wherever this file lives)
import { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function TextInput(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-slate-700">{label}</span>}
      <input
        {...rest}
        className={clsx(
          "h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none",
          "placeholder:text-slate-400",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          className
        )}
      />
    </label>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline"; // 👈 new variant
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: () => void;
};

export function Button({
  children,
  variant = "primary",
  type = "button",
  className,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-semibold h-11 transition";

  let styles = "";

  switch (variant) {
    case "primary":
      styles =
        "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 shadow-[0_10px_25px_rgba(37,99,235,0.35)]";
      break;
    case "secondary":
      styles = "bg-slate-100 text-slate-800 hover:bg-slate-200";
      break;
    case "outline":
      // 👉 this is the Figma-style white button with blue border
      styles =
        "border border-blue-600 bg-white text-blue-600 hover:bg-blue-50";
      break;
  }

  return (
    <button type={type} className={clsx(base, styles, className)} {...rest}>
      {children}
    </button>
  );
}
