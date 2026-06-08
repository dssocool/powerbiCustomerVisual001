"use strict";

export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
        return "$0";
    }
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
        return "0";
    }
    return new Intl.NumberFormat("en-US").format(value);
}

export function formatText(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (value instanceof Date) {
        return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return String(value);
}
