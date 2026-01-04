/**
 * Проверяет валидность email
 * @param email - email для проверки
 * @returns true если email валиден
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверяет валидность телефона (российский формат)
 * @param phone - номер телефона
 * @returns true если номер валиден
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex =
    /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
}

/**
 * Проверяет надежность пароля
 * @param password - пароль
 * @returns объект с результатом и сообщением
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Пароль должен содержать минимум 8 символов",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Пароль должен содержать заглавную букву",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Пароль должен содержать строчную букву",
    };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Пароль должен содержать цифру" };
  }
  return { isValid: true };
}
