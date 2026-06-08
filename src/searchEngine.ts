"use strict";

export function normalizeSearchInput(query: string): string {
    return query.trim().toLowerCase();
}

function normalize(value: string): string {
    return normalizeSearchInput(value);
}

export function parseQuery(query: string): { exact: boolean; term: string } {
    const trimmed = query.trim();
    const quotedMatch = trimmed.match(/^['"](.+)['"]$/);
    if (quotedMatch) {
        return { exact: true, term: normalize(quotedMatch[1]) };
    }
    return { exact: false, term: normalize(trimmed) };
}
