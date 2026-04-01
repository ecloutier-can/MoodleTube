/**
 * Extracts the YouTube Video ID from various URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} - The Video ID or null if invalid.
 */
export const extractVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};
