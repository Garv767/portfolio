/**
 * Formats image URLs to ensure direct image access.
 * Automatically converts GitHub repository blob URLs (HTML page viewer)
 * into direct raw content URLs (raw.githubusercontent.com) that load in <img> tags.
 * Also handles relative public asset paths.
 */
export function formatImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();

  // Handle GitHub blob URLs: https://github.com/user/repo/blob/ref/path
  if (trimmed.includes("github.com") && trimmed.includes("/blob/")) {
    return trimmed
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }

  return trimmed;
}
