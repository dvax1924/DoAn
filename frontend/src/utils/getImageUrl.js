const apiBaseUrl = (import.meta.env.VITE_API_URL || '')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

export function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}
