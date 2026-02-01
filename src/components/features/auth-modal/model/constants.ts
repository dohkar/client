/**
 * Константы для модального окна авторизации
 */

/** Время таймера для повторной отправки OTP (в секундах) */
export const OTP_RESEND_COOLDOWN = 60;

/** Длина OTP кода */
export const OTP_LENGTH = 6;

/** Задержка перед автоматическим закрытием модалки после успешного входа (мс) */
export const SUCCESS_AUTO_CLOSE_DELAY = 1500;

/** Сообщения об ошибках */
export const ERROR_MESSAGES = {
  INVALID_CONTACT: "Введите корректный email или номер телефона",
  OTP_SEND_FAILED: "Не удалось отправить код. Попробуйте ещё раз",
  OTP_VERIFY_FAILED: "Неверный код. Попробуйте ещё раз",
  OTP_EXPIRED: "Код истёк. Запросите новый код",
  NETWORK_ERROR: "Ошибка сети. Проверьте подключение",
  EMAIL_NOT_SUPPORTED: "Вход по email временно недоступен. Введите номер телефона.",
} as const;
