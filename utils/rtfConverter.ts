
/**
 * A simplified converter from HTML to Rich Text Format (RTF).
 * Handles basic tags like headings, paragraphs, bold, italic, and lists.
 * @param html The HTML string to convert.
 * @returns A string containing the RTF content.
 */
export const htmlToRtf = (html: string): string => {
  // Basic RTF header
  let rtf = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\pard';

  // Basic character escaping
  html = html.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');

  // Convert HTML tags to RTF equivalents. This is a simplified conversion.
  html = html
    .replace(/<h1>(.*?)<\/h1>/g, '{\\pard\\sa200\\sl276\\slmult1\\b\\f0\\fs48 $1\\par}')
    .replace(/<h2>(.*?)<\/h2>/g, '{\\pard\\sa200\\sl276\\slmult1\\b\\f0\\fs40 $1\\par}')
    .replace(/<h3>(.*?)<\/h3>/g, '{\\pard\\sa200\\sl276\\slmult1\\b\\f0\\fs32 $1\\par}')
    .replace(/<strong>(.*?)<\/strong>/g, '{\\b $1}')
    .replace(/<b>(.*?)<\/b>/g, '{\\b $1}')
    .replace(/<em>(.*?)<\/em>/g, '{\\i $1}')
    .replace(/<i>(.*?)<\/i>/g, '{\\i $1}')
    .replace(/<ul>/g, '{\\pard')
    .replace(/<\/ul>/g, '\\pard}')
    .replace(/<ol>/g, '{\\pard') // Treat ordered lists as bulleted for simplicity
    .replace(/<\/ol>/g, '\\pard}')
    .replace(/<li>(.*?)<\/li>/g, '{\\pard\\fi-360\\bullet\\tx360 $1\\par}')
    .replace(/<p>(.*?)<\/p>/g, '{\\pard\\sa200\\sl276\\slmult1 $1\\par}')
    .replace(/<br\s*\/?>/g, '\\line ');

  // Strip any remaining HTML tags
  html = html.replace(/<[^>]*>/g, '');

  rtf += html;

  // RTF footer
  rtf += '}';

  return rtf;
};
