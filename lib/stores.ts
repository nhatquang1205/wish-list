/**
 * Known shop hostnames get a friendly label. A local map rather than a favicon
 * service, so no third party ever sees which links are on the list.
 */
const KNOWN: Array<[RegExp, string]> = [
  [/(^|\.)shopee\./, "Shopee"],
  [/(^|\.)lazada\./, "Lazada"],
  [/(^|\.)tiki\.vn$/, "Tiki"],
  [/(^|\.)sendo\.vn$/, "Sendo"],
  [/(^|\.)tiktok\.com$/, "TikTok Shop"],
  [/(^|\.)amazon\./, "Amazon"],
  [/(^|\.)etsy\.com$/, "Etsy"],
  [/(^|\.)uniqlo\./, "Uniqlo"],
  [/(^|\.)zara\.com$/, "Zara"],
  [/(^|\.)hm\.com$/, "H&M"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$/, "Facebook"],
];

export function storeLabel(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const match = KNOWN.find(([pattern]) => pattern.test(host));
    return match ? match[1] : host;
  } catch {
    return null;
  }
}
