// Emails autorizados - apenas a Vivianne entra no HUB
const COACH_EMAILS = [
  'viv.saraiva@gmail.com',
  'vivnasc@gmail.com',
  'vivianne.saraiva@outlook.com',
]

export function isCoach(email: string | undefined | null): boolean {
  if (!email) return false
  return COACH_EMAILS.includes(email.toLowerCase())
}
