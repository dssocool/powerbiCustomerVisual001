"use strict";

function normalize(value: string): string {
    return value.toLowerCase().trim();
}

export function parseQuery(query: string): { exact: boolean; term: string } {
    const trimmed = query.trim();
    const quotedMatch = trimmed.match(/^['"](.+)['"]$/);
    if (quotedMatch) {
        return { exact: true, term: normalize(quotedMatch[1]) };
    }
    return { exact: false, term: normalize(trimmed) };
}
