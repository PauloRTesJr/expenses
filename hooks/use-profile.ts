"use client";

import { useState, useEffect, useCallback } from "react";
import { ProfileService } from "../lib/profile/service";
import type {
  ProfileWithAvatar,
  ProfileUpdate,
  AvatarUploadResult,
} from "../types/database";

interface UseProfileReturn {
  profile: ProfileWithAvatar | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<ProfileWithAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar o perfil atual
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentProfile = await ProfileService.getCurrentProfile();
      setProfile(currentProfile);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar o perfil
  const updateProfile = useCallback(
    async (data: ProfileUpdate) => {
      if (!profile) {
        throw new Error("Perfil não carregado");
      }

      try {
        setError(null);

        const updatedProfile = await ProfileService.updateProfile(
          profile.id,
          data
        );
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao atualizar perfil";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [profile]
  );

  // Função para upload de avatar
  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      if (!profile) {
        throw new Error("Perfil não carregado");
      }

      try {
        setError(null);

        const result: AvatarUploadResult = await ProfileService.uploadAvatar(
          profile.id,
          file
        );

        // Atualizar o perfil com a nova URL do avatar
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: result.url } : null
        );

        return result.url;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao fazer upload do avatar";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [profile]
  );

  // Função para deletar avatar
  const deleteAvatar = useCallback(async () => {
    if (!profile) {
      throw new Error("Perfil não carregado");
    }

    try {
      setError(null);

      await ProfileService.deleteAvatar(profile.id);

      // Atualizar o perfil removendo a URL do avatar
      setProfile((prev) => (prev ? { ...prev, avatar_url: null } : null));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao deletar avatar";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [profile]);

  // Função para completar onboarding
  const completeOnboarding = useCallback(async () => {
    if (!profile) {
      throw new Error("Perfil não carregado");
    }

    try {
      setError(null);

      await ProfileService.completeOnboarding(profile.id);

      // Atualizar o perfil marcando onboarding como completo
      setProfile((prev) =>
        prev ? { ...prev, onboarding_completed: true } : null
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao completar onboarding";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [profile]);

  // Função para recarregar o perfil
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Carregar perfil na inicialização
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshProfile,
    isOnboardingCompleted: profile?.onboarding_completed || false,
    completeOnboarding,
  };
};
