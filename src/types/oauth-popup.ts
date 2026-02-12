import type { User } from "./common";

/** Допустимые типы сообщений от popup к opener */
export type OAuthPopupMessageType = "oauth:success" | "oauth:error" | "oauth:linked";

export interface OAuthPopupMessageSuccess {
  type: "oauth:success";
  user: User;
}

export interface OAuthPopupMessageError {
  type: "oauth:error";
  error: string;
}

export interface OAuthPopupMessageLinked {
  type: "oauth:linked";
  user: User;
  provider: "google" | "yandex" | "vk";
}

export type OAuthPopupMessage =
  | OAuthPopupMessageSuccess
  | OAuthPopupMessageError
  | OAuthPopupMessageLinked;

/** Проверка, что payload — успешное сообщение */
export function isOAuthSuccess(
  data: unknown
): data is OAuthPopupMessageSuccess {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as OAuthPopupMessageSuccess).type === "oauth:success" &&
    "user" in data
  );
}

/** Проверка, что payload — сообщение об ошибке */
export function isOAuthError(data: unknown): data is OAuthPopupMessageError {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as OAuthPopupMessageError).type === "oauth:error" &&
    "error" in data
  );
}

/** Проверка, что payload — сообщение о привязке аккаунта */
export function isOAuthLinked(data: unknown): data is OAuthPopupMessageLinked {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as OAuthPopupMessageLinked).type === "oauth:linked" &&
    "user" in data &&
    "provider" in data
  );
}

export type OAuthPopupProvider = "google" | "yandex" | "vk";
