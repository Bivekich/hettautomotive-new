/**
 * Converts a string to a URL-friendly slug
 * @param input The string to convert to a slug
 * @returns A URL-friendly slug
 */
export const slugify = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
    .trim();
}; 