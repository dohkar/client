/**
 * Утилиты для модального окна авторизации
 */

import { EMAIL_REGEX, PHONE_REGEX } from "../model/constants";

/** Тип контакта */
export type ContactType = "email" | "phone" | "invalid";

/**
 * Определяет тип контакта (email или phone)
 */
export function detectContactType(contact: string): ContactType {
  const trimmed = contact.trim();

  if (EMAIL_REGEX.test(trimmed)) {
    return "email";
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11 && !trimmed.includes("@")) {
    return "phone";
  }

  if (PHONE_REGEX.test(trimmed)) {
    return "phone";
  }

  return "invalid";
}

/**
 * Нормализует номер телефона к формату 7XXXXXXXXXX (без +)
 * Соответствует формату, ожидаемому backend
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  if (digits.startsWith("7")) {
    return digits;
  }
  return `7${digits}`;
}

/**
 * Валидирует контакт (email или phone)
 */
export function validateContact(contact: string): boolean {
  const type = detectContactType(contact);

  if (type === "email") {
    return true;
  }

  if (type === "phone") {
    const digits = contact.replace(/\D/g, "");
    const phoneDigits =
      digits.startsWith("8") || digits.startsWith("7") ? digits.slice(1) : digits;
    return phoneDigits.length === 10;
  }

  return false;
}

/**
 * Нормализует контакт (email или phone) для отправки на backend
 */
export function normalizeContact(contact: string): {
  contact: string;
  method: "email" | "phone";
} {
  const contactType = detectContactType(contact);

  if (contactType === "invalid") {
    throw new Error("Некорректный формат контакта");
  }

  if (contactType === "phone") {
    return {
      contact: normalizePhone(contact),
      method: "phone",
    };
  }

  return {
    contact: contact.trim().toLowerCase(),
    method: "email",
  };
}

/**
 * Форматирует номер телефона в реальном времени
 * 89281234567 -> +7 (928) 123-45-67
 */
export function formatPhoneInput(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  let phoneDigits = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  if (!phoneDigits.startsWith("7")) {
    phoneDigits = `7${phoneDigits}`;
  }
  phoneDigits = phoneDigits.slice(0, 11);

  if (phoneDigits.length <= 1) {
    return `+${phoneDigits}`;
  }
  if (phoneDigits.length <= 4) {
    return `+${phoneDigits[0]} (${phoneDigits.slice(1)}`;
  }
  if (phoneDigits.length <= 7) {
    return `+${phoneDigits[0]} (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4)}`;
  }
  if (phoneDigits.length <= 9) {
    return `+${phoneDigits[0]} (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7)}`;
  }

  return `+${phoneDigits[0]} (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7, 9)}-${phoneDigits.slice(9)}`;
}

/**
 * Маскирует контакт для отображения
 * example@email.com -> e****e@domain.com
 * +79991234567 -> +7 (999) ***-**-67
 */
export function maskContact(contact: string): string {
  const type = detectContactType(contact);

  if (type === "email") {
    const [local, domain] = contact.split("@");
    if (!domain) return contact;
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }

  if (type === "phone") {
    const normalized = normalizePhone(contact);
    if (normalized.length === 11) {
      return `+${normalized[0]} (${normalized.slice(1, 4)}) ***-**-${normalized.slice(9)}`;
    }
  }

  return contact;
}
