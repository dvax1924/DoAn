import { SOCKET_BASE_URL } from '../api/apiBaseUrl';

export function getImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return SOCKET_BASE_URL ? `${SOCKET_BASE_URL}${normalizedPath}` : normalizedPath;
}
