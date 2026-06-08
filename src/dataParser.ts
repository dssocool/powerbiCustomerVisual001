"use strict";

import powerbi from "powerbi-visuals-api";
import { LoanRecord } from "./types";
import { formatText } from "./formatUtils";

import DataView = powerbi.DataView;

const ROLE_NAMES: Array<keyof Omit<LoanRecord, "index">> = [
    "recipient",
    "location",
    "loanStatus",
    "loanAmount",
    "dateApproved",
    "lender",
    "zipCode",
    "businessType",
    "amountForgiven",
    "locationType",
    "industry",
    "dateApprovedDetail",
    "payroll",
    "utilities",
    "mortgageInterest",
    "healthCare",
    "rent",
    "refinanceEidl",
    "debtInterest",
    "jobsReported",
    "businessAge"
];

const NUMERIC_FIELDS = new Set<keyof LoanRecord>([
    "loanAmount",
    "amountForgiven",
    "payroll",
    "utilities",
    "mortgageInterest",
    "healthCare",
    "rent",
    "refinanceEidl",
    "debtInterest",
    "jobsReported"
]);

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
}

function parseFieldValue(field: keyof LoanRecord, value: unknown): string | number | null {
    if (NUMERIC_FIELDS.has(field)) {
        return parseNumber(value);
    }
    return formatText(value);
}

export function buildRoleIndexMap(columns: powerbi.DataViewMetadataColumn[]): Map<string, number> {
    const map = new Map<string, number>();
    columns.forEach((column, index) => {
        if (column.roles) {
            Object.keys(column.roles).forEach(role => map.set(role, index));
        }
    });
    return map;
}

export function parseLoanRecords(dataView: DataView | undefined): LoanRecord[] {
    if (!dataView?.table?.columns?.length) {
        return [];
    }

    const table = dataView.table;
    const roleIndex = buildRoleIndexMap(table.columns);
    const rowCount = table.rows?.length ?? 0;

    if (rowCount === 0) {
        return [];
    }

    const records: LoanRecord[] = [];

    for (let i = 0; i < rowCount; i++) {
        const row = table.rows[i];
        const record = { index: i } as LoanRecord;

        ROLE_NAMES.forEach(role => {
            const colIndex = roleIndex.get(role);
            const rawValue = colIndex !== undefined ? row[colIndex] : null;
            const parsed = parseFieldValue(role, rawValue);

            if (NUMERIC_FIELDS.has(role)) {
                (record as unknown as Record<string, number | null>)[role] = parsed as number | null;
            } else {
                (record as unknown as Record<string, string>)[role] = (parsed as string) ?? "";
            }
        });

        records.push(record);
    }

    return records;
}

export function hasBoundData(dataView: DataView | undefined): boolean {
    if (!dataView?.table?.columns?.length) {
        return false;
    }
    const roleIndex = buildRoleIndexMap(dataView.table.columns);
    return roleIndex.has("recipient") && roleIndex.has("searchColumn");
}
