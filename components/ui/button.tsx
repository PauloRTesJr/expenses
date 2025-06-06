import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95";

    const variants = {
      primary:
        "bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold focus:ring-[#1DB954]",
      secondary:
        "bg-[#2a2a2a] hover:bg-[#333] text-white border border-gray-700 hover:border-gray-600 focus:ring-gray-500",
      ghost:
        "text-gray-300 hover:text-white hover:bg-[#2a2a2a] focus:ring-gray-500",
      danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
