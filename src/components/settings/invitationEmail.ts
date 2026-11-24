export const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.'
export const DUPLICATE_EMAIL_MESSAGE = 'This email is already a member of the family plan.'

export function isValidInvitationEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
