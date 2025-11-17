/**
 * HTML Sanitization Utility
 *
 * Sanitizes HTML content to prevent XSS attacks while preserving
 * safe HTML formatting (headings, paragraphs, lists, links, etc.)
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * Allows safe HTML tags: p, br, strong, em, u, h1-h6, ul, ol, li, a, img
 * Strips: script, iframe, object, embed, form, input, style, etc.
 *
 * @param dirty - Unsanitized HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''

  // Configure DOMPurify to allow safe HTML tags
  const config = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'b',
      'i',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'blockquote',
      'pre',
      'code',
      'div',
      'span',
    ],
    ALLOWED_ATTR: [
      'href',
      'title',
      'alt',
      'src',
      'class',
      'target',
      'rel', // For links
    ],
    ALLOW_DATA_ATTR: false,
    // Ensure links are safe (prevent javascript: and data: URLs)
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  }

  return DOMPurify.sanitize(dirty, config)
}

/**
 * Sanitizes HTML and returns it as a React-compatible object
 * for use with dangerouslySetInnerHTML
 *
 * @param dirty - Unsanitized HTML string
 * @returns Object with __html property containing sanitized HTML
 */
export function sanitizeHtmlForReact(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) }
}
