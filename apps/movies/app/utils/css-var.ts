/**
 * Generates a CSS variable reference string with an optional fallback variable.
 *
 * @param name - The CSS custom property name (without the leading `--`).
 * @param fallback - Optional fallback property name to use if the first variable is unset.
 */
export function cssvar(name: string, fallback?: string) {
	return `var(--${name}${fallback ? `, --${fallback}` : ""})`;
}
