"use client";

import React, { useState } from "react";
import { useProfile } from "../../hooks/use-profile";
import { AvatarUpload } from "../../components/profile/avatar-upload";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function ProfilePage() {
  const {
    profile,
    loading,
    error,
    updateProfile,
    deleteAvatar,
    refreshProfile,
  } = useProfile();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone: "",
    location: "",
    website: "",
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        location: profile.location || "",
        website: profile.website || "",
      });
    }
    setEditing(false);
  };

  const handleAvatarUpload = async () => {
    await refreshProfile();
    setUploadError(null);
  };

  const handleAvatarError = (error: string) => {
    setUploadError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-800 rounded"></div>
              <div className="h-20 bg-gray-800 rounded"></div>
              <div className="h-20 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Perfil não encontrado</h1>
            <p className="text-gray-400 mb-6">
              Não foi possível carregar os dados do seu perfil.
            </p>
            <Button onClick={refreshProfile}>Tentar novamente</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Editar Perfil
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {uploadError && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{uploadError}</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6 space-y-6">
          {/* Seção do Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <AvatarUpload
              currentAvatar={profile.avatar_url}
              fallbackText={profile.full_name || profile.email}
              onUploadComplete={handleAvatarUpload}
              onError={handleAvatarError}
              size="xl"
            />

            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {profile.full_name || "Nome não informado"}
              </h2>
              <p className="text-gray-400">{profile.email}</p>
            </div>

            {profile.avatar_url && (
              <Button
                onClick={deleteAvatar}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-400 hover:bg-red-900/20"
              >
                Remover Foto
              </Button>
            )}
          </div>

          {/* Formulário de Informações */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome completo
              </label>
              {editing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  placeholder="Seu nome completo"
                  className="bg-gray-800 border-gray-700"
                />
              ) : (
                <p className="text-white bg-gray-800 rounded p-3">
                  {profile.full_name || "Não informado"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              {editing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Conte um pouco sobre você"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white"
                />
              ) : (
                <p className="text-white bg-gray-800 rounded p-3 min-h-[80px]">
                  {profile.bio || "Nenhuma bio informada"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
              </label>
              {editing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+55 11 99999-9999"
                  className="bg-gray-800 border-gray-700"
                />
              ) : (
                <p className="text-white bg-gray-800 rounded p-3">
                  {profile.phone || "Não informado"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Localização
              </label>
              {editing ? (
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Cidade, Estado"
                  className="bg-gray-800 border-gray-700"
                />
              ) : (
                <p className="text-white bg-gray-800 rounded p-3">
                  {profile.location || "Não informado"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              {editing ? (
                <Input
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://seusite.com"
                  className="bg-gray-800 border-gray-700"
                />
              ) : (
                <p className="text-white bg-gray-800 rounded p-3">
                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {profile.website}
                    </a>
                  ) : (
                    "Não informado"
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          {editing && (
            <div className="flex space-x-4 pt-4">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                Salvar Alterações
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="border-t border-gray-700 pt-6 text-sm text-gray-400">
            <p>
              Conta criada em:{" "}
              {new Date(profile.created_at).toLocaleDateString("pt-BR")}
            </p>
            <p>
              Última atualização:{" "}
              {new Date(profile.updated_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
