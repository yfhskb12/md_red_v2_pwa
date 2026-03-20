
/**
 * Decodes a Base64 string to a UTF-8 string.
 * Handles Unicode characters correctly.
 */
export const base64ToUtf8 = (str: string): string => {
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(str), c => c.charCodeAt(0)));
  } catch (e) {
    console.warn('Base64 decode error, falling back to atob', e);
    return atob(str);
  }
};

/**
 * Encodes a UTF-8 string to a Base64 string.
 * Handles Unicode characters correctly.
 */
export const utf8ToBase64 = (str: string): string => {
  try {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
  } catch (e) {
    console.warn('Base64 encode error, falling back to btoa', e);
    return btoa(str);
  }
};
