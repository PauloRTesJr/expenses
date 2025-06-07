"use client";

import React, { useState, useRef } from "react";
import { UserAvatar } from "./user-avatar";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  fallbackText?: string;
  onUploadComplete: (url: string) => void;
  onUploadStart?: () => void;
  onError?: (error: string) => void;
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  fallbackText,
  onUploadComplete,
  onUploadStart,
  onError,
  size = "lg",
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações básicas no cliente
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      onError?.("Arquivo muito grande. Máximo 5MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      onError?.("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP");
      return;
    }

    try {
      setUploading(true);
      onUploadStart?.();

      // Importar o hook dinamicamente para evitar problemas de hidratação
      const { useProfile } = await import("../../hooks/use-profile");

      // Como não podemos usar hook aqui, vamos usar o serviço diretamente
      const { ProfileService } = await import("../../lib/profile/service");

      // Para obter o user ID, vamos fazer uma chamada ao serviço
      const profile = await ProfileService.getCurrentProfile();
      if (!profile) {
        throw new Error("Usuário não encontrado");
      }

      const result = await ProfileService.uploadAvatar(profile.id, file);
      onUploadComplete(result.url);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer upload";
      onError?.(errorMessage);
    } finally {
      setUploading(false);
      // Limpar o input para permitir upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div className="relative group">
        <UserAvatar
          src={currentAvatar}
          fallbackText={fallbackText}
          size={size}
          onClick={handleClick}
          className={`
            ${!disabled && !uploading ? "cursor-pointer" : "cursor-default"}
            ${uploading ? "opacity-50" : ""}
          `}
        />

        {/* Overlay de upload */}
        {!disabled && !uploading && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 rounded-full 
                       flex items-center justify-center opacity-0 
                       group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleClick}
          >
            <span className="text-white text-xs font-medium">📷</span>
          </div>
        )}

        {/* Loading indicator */}
        {uploading && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 rounded-full 
                          flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Texto de instrução */}
      {!disabled && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {uploading ? "Enviando..." : "Clique para alterar"}
        </p>
      )}
    </div>
  );
};
