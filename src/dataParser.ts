"use strict";

import powerbi from "powerbi-visuals-api";
import { LoanRecord } from "./types";
import { formatText } from "./formatUtils";

import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import PrimitiveValue = powerbi.PrimitiveValue;

type DisplayField = keyof Omit<LoanRecord, "index" | `${string}Raw`>;
type RawNumericField = keyof Pick<
    LoanRecord,
    | "payrollRaw"
    | "utilitiesRaw"
    | "mortgageInterestRaw"
    | "healthCareRaw"
    | "rentRaw"
    | "refinanceEidlRaw"
    | "debtInterestRaw"
>;

const DISPLAY_COLUMNS: Record<string, DisplayField> = {
    loannumber: "loanNumber",
    recipient_display: "recipient",
    location_display: "location",
    areatype_display: "locationType",
    loanstatus_display: "loanStatus",
    loanamount_display: "loanAmount",
    dateapproved_display: "dateApproved",
    lender_display: "lender",
    businesstype_display: "businessType",
    forgivenessamount_display: "amountForgiven",
    industry_display: "industry",
    jobsreported_display: "jobsReported",
    businessage_display: "businessAge",
    payroll_display: "payroll",
    utilities_display: "utilities",
    mortgageinterest_display: "mortgageInterest",
    healthcare_display: "healthCare",
    rent_display: "rent",
    refinanceeidl_display: "refinanceEidl",
    debtinterest_display: "debtInterest"
};

const RAW_NUMERIC_COLUMNS: Record<string, RawNumericField> = {
    payroll_proceed: "payrollRaw",
    utilities_proceed: "utilitiesRaw",
    mortgage_interest_proceed: "mortgageInterestRaw",
    health_care_proceed: "healthCareRaw",
    rent_proceed: "rentRaw",
    refinance_eidl_proceed: "refinanceEidlRaw",
    debt_interest_proceed: "debtInterestRaw"
};

const EMPTY_RECORD: Omit<LoanRecord, "index"> = {
    loanNumber: "",
    recipient: "",
    location: "",
    loanStatus: "",
    loanAmount: "",
    dateApproved: "",
    lender: "",
    businessType: "",
    amountForgiven: "",
    locationType: "",
    industry: "",
    dateApprovedDetail: "",
    payroll: "",
    utilities: "",
    mortgageInterest: "",
    healthCare: "",
    rent: "",
    refinanceEidl: "",
    debtInterest: "",
    jobsReported: "",
    businessAge: "",
    payrollRaw: null,
    utilitiesRaw: null,
    mortgageInterestRaw: null,
    healthCareRaw: null,
    rentRaw: null,
    refinanceEidlRaw: null,
    debtInterestRaw: null
};

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
}

export function getPhysicalColumnName(column: DataViewMetadataColumn): string {
    const queryName = column.queryName;
    if (!queryName) {
        return column.displayName ?? "";
    }

    const innerMatch = queryName.match(/\(([^)]+)\)/);
    const path = innerMatch ? innerMatch[1] : queryName;
    const dotIndex = path.lastIndexOf(".");

    return dotIndex >= 0 ? path.substring(dotIndex + 1) : (column.displayName ?? path);
}

export function buildRoleIndexMap(columns: DataViewMetadataColumn[]): Map<string, number> {
    const map = new Map<string, number>();
    columns.forEach((column, index) => {
        if (column.roles) {
            Object.keys(column.roles).forEach(role => map.set(role, index));
        }
    });
    return map;
}

function buildColumnNameIndexMap(columns: DataViewMetadataColumn[]): Map<string, number> {
    const map = new Map<string, number>();
    columns.forEach((column, index) => {
        const physical = getPhysicalColumnName(column);
        map.set(physical.toLowerCase(), index);
        if (column.displayName) {
            map.set(column.displayName.toLowerCase(), index);
        }
    });
    return map;
}

function getCellValue(row: PrimitiveValue[], colMap: Map<string, number>, columnName: string): unknown {
    const colIndex = colMap.get(columnName.toLowerCase());
    return colIndex !== undefined ? row[colIndex] : null;
}

function createEmptyRecord(index: number): LoanRecord {
    return { index, ...EMPTY_RECORD };
}

export function parseLoanRecords(dataView: DataView | undefined): LoanRecord[] {
    if (!dataView?.table?.columns?.length) {
        return [];
    }

    const table = dataView.table;
    const colMap = buildColumnNameIndexMap(table.columns);
    const rowCount = table.rows?.length ?? 0;

    if (rowCount === 0) {
        return [];
    }

    const records: LoanRecord[] = [];

    for (let i = 0; i < rowCount; i++) {
        const row = table.rows[i];
        const record = createEmptyRecord(i);

        Object.entries(DISPLAY_COLUMNS).forEach(([columnName, field]) => {
            const value = formatText(getCellValue(row, colMap, columnName));
            (record as unknown as Record<string, string>)[field] = value;
        });

        record.dateApprovedDetail = record.dateApproved;

        Object.entries(RAW_NUMERIC_COLUMNS).forEach(([columnName, field]) => {
            (record as unknown as Record<string, number | null>)[field] = parseNumber(
                getCellValue(row, colMap, columnName)
            );
        });

        if (!record.loanNumber) {
            record.loanNumber = String(i);
        }

        records.push(record);
    }

    return records;
}

export function hasBoundData(dataView: DataView | undefined): boolean {
    if (!dataView?.table?.columns?.length) {
        return false;
    }
    const roleIndex = buildRoleIndexMap(dataView.table.columns);
    return roleIndex.has("searchColumn");
}
