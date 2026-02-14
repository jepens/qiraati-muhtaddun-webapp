/**
 * Shared voice command parsing utilities.
 *
 * Used by both Qiraati.tsx (surah list page) and SearchWidget.tsx
 * (surah detail drawer) to avoid duplicating voice→navigate logic.
 */

import type { Surat } from '@/types/quran';

// ─── Constants ───

export const PREFIX_REGEX = /^(surat|surah|baca|buka|cari)(\s+|$)/i;
const MULTI_SURAH_PATTERN = /\b(dan|atau|sama)\b/i;

// ─── Helpers ───

export function removePrefixes(str: string): string {
    return str.toLowerCase().replace(PREFIX_REGEX, '').trim();
}

/** Check if the text mentions multiple surahs (e.g. "yasin dan al-mulk") */
export function hasMultipleSurahs(text: string): boolean {
    const cleaned = text.toLowerCase().replace(PREFIX_REGEX, '').trim();
    return MULTI_SURAH_PATTERN.test(cleaned);
}

// ─── Voice Command Result ───

export type VoiceCommandResult =
    | { type: 'surah_navigate'; surahNomor: number; surahNamaLatin: string }
    | { type: 'surah_ayat_navigate'; surahNomor: number; surahNamaLatin: string; ayatNumber: number }
    | { type: 'content_search'; searchQuery: string }
    | { type: 'multi_surah_rejected' }
    | { type: 'not_found'; originalText: string };

// ─── Parser ───

/**
 * Parse voice transcript into a navigation intent.
 *
 * Priority order:
 * 1. Multi-surah guard  → reject
 * 2. "surat X ayat Y"   → surah + ayat navigation
 * 3. "tentang X"         → content search
 * 4. Surah name (Fuse)   → navigate to surah
 * 5. Nothing matched     → not_found
 */
export function parseVoiceCommand(
    text: string,
    fuseSearch: (query: string) => Surat[],
): VoiceCommandResult {
    const lowerText = text.toLowerCase();

    // 1. Multi-surah guard
    if (hasMultipleSurahs(lowerText)) {
        return { type: 'multi_surah_rejected' };
    }

    // 2. "surat X ayat Y" pattern
    const ayatMatch = lowerText.match(/(?:surat|surah)?\s*(.+?)\s+ayat\s+(\d+)/);
    if (ayatMatch) {
        const surahName = ayatMatch[1];
        const ayatNum = parseInt(ayatMatch[2]);
        const cleanName = removePrefixes(surahName);
        const results = fuseSearch(cleanName);
        if (results.length > 0) {
            return {
                type: 'surah_ayat_navigate',
                surahNomor: results[0].nomor,
                surahNamaLatin: results[0].namaLatin,
                ayatNumber: ayatNum,
            };
        }
    }

    // 3. Content search: "tentang X" or "cari ayat tentang X"
    const contentMatch = lowerText.match(/(?:cari\s+)?(?:ayat\s+)?tentang\s+(.+)/);
    if (contentMatch) {
        return { type: 'content_search', searchQuery: contentMatch[1].trim() };
    }

    // 4. Surah name search (Fuse.js)
    const cleanQuery = removePrefixes(text);
    if (cleanQuery) {
        const results = fuseSearch(cleanQuery);
        if (results.length > 0) {
            return {
                type: 'surah_navigate',
                surahNomor: results[0].nomor,
                surahNamaLatin: results[0].namaLatin,
            };
        }
    }

    // 5. Nothing matched
    return { type: 'not_found', originalText: text };
}
