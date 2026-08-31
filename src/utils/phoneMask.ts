/**
  * Brazilian Phone Mask Utility
  * Formats raw digits into (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  */

export function formatBrazilianPhone(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function isValidBrazilianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Valid Brazilian phones have 10 or 11 digits (DDD + 8 or 9 digits)
  return digits.length >= 10 && digits.length <= 11;
}

export function getCleanDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
