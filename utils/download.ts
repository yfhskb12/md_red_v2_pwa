
/**
 * Creates a file from a string and triggers a browser download.
 * @param content The string content of the file.
 * @param fileName The desired name of the file, including extension.
 * @param mimeType The MIME type of the file (e.g., 'text/markdown').
 */
export const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
