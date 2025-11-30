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
  variant?: "primary" | "secondary";
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
    "inline-flex items-center justify-center rounded-lg text-sm font-medium h-11 w-full transition";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
      : "bg-slate-100 text-slate-800 hover:bg-slate-200";

  return (
    <button type={type} className={clsx(base, styles, className)} {...rest}>
      {children}
    </button>
  );
}
