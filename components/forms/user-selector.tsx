"use client";

import { useState, useEffect, useRef } from "react";
import { searchUsers } from "@/lib/supabase/client";
import { Profile } from "@/types/database";

interface UserSelectorProps {
  selectedUsers: string[];
  onUsersChange: (userIds: string[]) => void;
}

export function UserSelector({
  selectedUsers,
  onUsersChange,
}: UserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Pick<Profile, "id" | "email" | "full_name">[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<
    Pick<Profile, "id" | "email" | "full_name">[]
  >([]);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search with better error handling
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setError(null);
        setNoResults(false);

        try {
          const results = await searchUsers(searchQuery);
          setSearchResults(results);
          setNoResults(results.length === 0);
          setIsDropdownOpen(true);
        } catch (error) {
          console.error("Erro ao buscar usuários:", error);
          setError("Erro ao buscar usuários. Tente novamente.");
          setSearchResults([]);
          setNoResults(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsDropdownOpen(false);
        setNoResults(false);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (
    user: Pick<Profile, "id" | "email" | "full_name">
  ) => {
    if (!selectedUsers.includes(user.id)) {
      const newSelectedUsers = [...selectedUsers, user.id];
      const newSelectedProfiles = [...selectedProfiles, user];

      setSelectedProfiles(newSelectedProfiles);
      onUsersChange(newSelectedUsers);
      setSearchQuery("");
      setSearchResults([]);
      setIsDropdownOpen(false);

      // Focus back to input for better UX
      inputRef.current?.focus();
    }
  };

  const handleRemoveUser = (userId: string) => {
    const newSelectedUsers = selectedUsers.filter((id) => id !== userId);
    const newSelectedProfiles = selectedProfiles.filter(
      (profile) => profile.id !== userId
    );

    setSelectedProfiles(newSelectedProfiles);
    onUsersChange(newSelectedUsers);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2 && searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  const getUserDisplayName = (
    user: Pick<Profile, "id" | "email" | "full_name">
  ) => {
    return user.full_name || user.email;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Compartilhar com usuários (opcional)
      </label>

      {/* Selected Users Tags */}
      {selectedProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-[rgba(36,43,61,0.5)] border border-gray-600 rounded-lg">
          {selectedProfiles.map((user) => (
            <div
              key={user.id}
              className="group flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm transition-all duration-200 hover:bg-blue-500/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/40 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-200">
                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-blue-200 font-medium">
                  {getUserDisplayName(user)}
                </span>
                {user.full_name && (
                  <span className="text-blue-300/60 text-xs">{user.email}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveUser(user.id)}
                className="text-blue-300/60 hover:text-red-300 transition-colors p-0.5 rounded-full hover:bg-red-500/20"
                aria-label={`Remover ${getUserDisplayName(user)}`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input with Ant Design styling */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center justify-center w-12 pointer-events-none text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Buscar usuários por email ou nome..."
            className="w-full h-12 px-3 py-2 text-sm rounded-lg border transition-all duration-200 ease-in-out bg-[rgba(36,43,61,0.85)] backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-800/50 hover:border-gray-500 hover:shadow-sm border-gray-600 focus:border-[--accent-primary] focus:shadow-[0_0_0_2px_rgba(102,126,234,0.2)] pl-12 pr-10"
          />

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 animate-spin text-[--accent-primary]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}

          {/* Clear button */}
          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsDropdownOpen(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-[#242b3d] border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-hidden"
          >
            {/* Error State */}
            {error && (
              <div className="px-4 py-3 text-sm text-red-300 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* No Results State */}
            {!error && noResults && (
              <div className="px-4 py-6 text-center text-gray-400">
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-sm">Nenhum usuário encontrado</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tente buscar por email ou nome
                </p>
              </div>
            )}

            {/* Results List */}
            {!error && searchResults.length > 0 && (
              <div className="overflow-y-auto max-h-64">
                {searchResults.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    disabled={selectedUsers.includes(user.id)}
                    className={`w-full px-4 py-3 text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-700/50 last:border-b-0 ${
                      selectedUsers.includes(user.id)
                        ? "bg-gray-700/30 cursor-not-allowed"
                        : "hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                          {getUserDisplayName(user).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium truncate">
                            {getUserDisplayName(user)}
                          </span>
                          {selectedUsers.includes(user.id) && (
                            <svg
                              className="w-4 h-4 text-green-400 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        {user.full_name && (
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Digite pelo menos 2 caracteres para buscar usuários
      </p>
    </div>
  );
}
