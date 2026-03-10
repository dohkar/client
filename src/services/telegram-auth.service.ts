import { apiClient } from "@/lib/api-client";
import { accessTokenStorage } from "@/lib/access-token-storage";
import { API_ENDPOINTS } from "@/constants/routes";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramAuthResponse {
  accessToken: string;
  user: { id: string; name?: string; email?: string; phone?: string; avatar?: string; isPremium?: boolean; role?: string; provider?: string; createdAt?: string };
}

export async function loginWithTelegram(user: TelegramUser): Promise<TelegramAuthResponse> {
  const data = await apiClient.post<TelegramAuthResponse>(
    API_ENDPOINTS.auth.telegram,
    user
  );
  if (data?.accessToken) {
    accessTokenStorage.setAccessToken(data.accessToken);
  }
  return data;
}
