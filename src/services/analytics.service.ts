import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";

/** Типы контакт-попытки (совпадают с бэкендом ContactAttemptType). */
export type ContactAttemptType = "PHONE_CLICK" | "CHAT_OPEN";

export const analyticsService = {
  /**
   * Записать просмотр объявления (один раз за сессию/пользователя на бэкенде).
   * Вызывать при загрузке страницы листинга.
   */
  async recordView(listingId: string): Promise<void> {
    try {
      await apiClient.post<{ recorded: boolean }>(
        API_ENDPOINTS.analytics.recordView(listingId)
      );
    } catch {
      // Не блокируем UI при ошибке аналитики
    }
  },

  /**
   * Записать контакт-попытку (телефон или чат).
   * Вызывать при клике «Показать телефон» или «Написать»; не блокирует основное действие.
   */
  async recordContact(
    listingId: string,
    type: ContactAttemptType
  ): Promise<void> {
    try {
      await apiClient.post<{ recorded: boolean }>(
        API_ENDPOINTS.analytics.recordContact(listingId),
        { type }
      );
    } catch {
      // Не блокируем UI при ошибке аналитики
    }
  },
};
