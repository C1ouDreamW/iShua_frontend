const PAGE_FLASH_KEY = "ishua_page_flash";

export function setPageFlash(message: string) {
  try {
    sessionStorage.setItem(PAGE_FLASH_KEY, message);
  } catch {
    // Ignore storage errors.
  }
}

export function consumePageFlash(): string | null {
  try {
    const message = sessionStorage.getItem(PAGE_FLASH_KEY);
    if (message) {
      sessionStorage.removeItem(PAGE_FLASH_KEY);
    }
    return message;
  } catch {
    return null;
  }
}
