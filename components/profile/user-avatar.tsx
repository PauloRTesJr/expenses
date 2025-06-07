"use client";

import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackText?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
  xl: "w-16 h-16 text-xl",
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "Avatar do usuário",
  size = "md",
  className = "",
  fallbackText,
  onClick,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const baseClasses = `
    relative inline-flex items-center justify-center 
    rounded-full bg-gray-500 text-white font-medium
    ${sizeClasses[size]}
    ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
    ${className}
  `;

  // Se não há imagem ou houve erro, mostrar fallback
  if (!src || imageError) {
    return (
      <div className={baseClasses} onClick={onClick}>
        {fallbackText ? fallbackText.charAt(0).toUpperCase() : "👤"}
      </div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      <Image
        src={src}
        alt={alt}
        fill
        className="rounded-full object-cover"
        onError={() => setImageError(true)}
        sizes="(max-width: 64px) 64px, 64px"
      />
    </div>
  );
};
