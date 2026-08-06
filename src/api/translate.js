/**
 * Free client-side translation to Nepali using Google's unofficial translate
 * endpoint (client=gtx). No API key required — it is used by many client-side
 * tools. If Google ever blocks it, admins can still type Nepali manually via
 * the नेपाली tab in the editable field.
 */
export async function translateToNepali(text, target = 'ne') {
  const clean = String(text == null ? '' : text).trim();
  if (!clean) return '';

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx&sl=auto&tl=' + encodeURIComponent(target) +
    '&dt=t&q=' + encodeURIComponent(clean);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation service unavailable');

  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected translation response');
  }

  return data[0].map((seg) => (seg && seg[0]) || '').join('').trim();
}
