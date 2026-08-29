/**
 * Password complexity policy, enforced only when a password is first set
 * (signup, invite acceptance) — never retroactively, so it can't lock
 * anyone out of an account created before this policy existed.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) {
    return "Password must be at least 10 characters.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must include at least one symbol (e.g. ! @ # $ %).";
  }
  return null;
}
