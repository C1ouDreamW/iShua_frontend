const AUTH_FLASH_KEY = "ishua_auth_flash";

export function setAuthFlash(message: string) {
  try {
    sessionStorage.setItem(AUTH_FLASH_KEY, message);
  } catch {
    // Ignore storage errors.
  }
}

export function consumeAuthFlash(): string | null {
  try {
    const message = sessionStorage.getItem(AUTH_FLASH_KEY);
    if (message) {
      sessionStorage.removeItem(AUTH_FLASH_KEY);
    }
    return message;
  } catch {
    return null;
  }
}
