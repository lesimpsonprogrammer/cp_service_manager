// Common free/consumer webmail providers — self-serve signup requires a
// work email at a real company domain. An admin-issued invite bypasses this
// (they already vetted the specific email), so this only gates the open
// "request an account" path.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
]);

export function isFreeEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return !!domain && FREE_EMAIL_DOMAINS.has(domain);
}
