"use strict";

import { LoanRecord } from "./types";

const SEARCHABLE_FIELDS: Array<keyof LoanRecord> = [
    "recipient",
    "location",
    "lender",
    "zipCode",
    "businessType",
    "industry",
    "loanStatus"
];

function normalize(value: string): string {
    return value.toLowerCase().trim();
}

function parseQuery(query: string): { exact: boolean; term: string } {
    const trimmed = query.trim();
    const quotedMatch = trimmed.match(/^['"](.+)['"]$/);
    if (quotedMatch) {
        return { exact: true, term: normalize(quotedMatch[1]) };
    }
    return { exact: false, term: normalize(trimmed) };
}

function fieldMatches(record: LoanRecord, field: keyof LoanRecord, exact: boolean, term: string): boolean {
    const raw = record[field];
    if (raw === null || raw === undefined) {
        return false;
    }
    const value = normalize(String(raw));
    if (!term) {
        return true;
    }
    return exact ? value === term : value.includes(term);
}

export function filterRecords(records: LoanRecord[], query: string): LoanRecord[] {
    const { exact, term } = parseQuery(query);

    if (!term) {
        return records;
    }

    return records.filter(record =>
        SEARCHABLE_FIELDS.some(field => fieldMatches(record, field, exact, term))
    );
}
