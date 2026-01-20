/**
 * Utility functions for formatting and validating US phone numbers
 */

export interface PhoneFormatResult {
  formatted: string | null;
  isValid: boolean;
  wasAlreadyFormatted: boolean;
}

/**
 * Formats a phone number to the US standard format: +1 (XXX) XXX-XXXX
 * @param phone - The phone number to format
 * @returns Object with formatted number, validity status, and whether it was already formatted
 */
export function formatUSPhone(phone: string): PhoneFormatResult {
  if (!phone || phone.trim() === "") {
    return { formatted: null, isValid: false, wasAlreadyFormatted: false };
  }

  // Extract only digits
  const digits = phone.replace(/\D/g, "");

  // Check if already in correct format
  const usFormatRegex = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;
  if (usFormatRegex.test(phone)) {
    return { formatted: phone, isValid: true, wasAlreadyFormatted: true };
  }

  // 10 digits: number without country code
  if (digits.length === 10) {
    const formatted = `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return { formatted, isValid: true, wasAlreadyFormatted: false };
  }

  // 11 digits starting with 1: number with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    const formatted = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return { formatted, isValid: true, wasAlreadyFormatted: false };
  }

  // Invalid format
  return { formatted: null, isValid: false, wasAlreadyFormatted: false };
}

export interface PhoneAnalysisResult {
  alreadyFormatted: number;
  toFormat: number;
  invalid: number;
  changes: Array<{
    leadId: string;
    leadName: string;
    currentPhone: string;
    newPhone: string;
  }>;
  invalidLeads: Array<{
    leadId: string;
    leadName: string;
    phone: string;
  }>;
}
