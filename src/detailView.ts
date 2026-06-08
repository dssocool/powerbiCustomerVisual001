"use strict";

import { FinancialCategory, LoanRecord } from "./types";
import { formatCurrency, formatNumber, formatText } from "./formatUtils";

export interface DetailViewOptions {
    container: HTMLElement;
    record: LoanRecord;
}

function createMetricField(label: string, value: string, subLabel?: string): HTMLElement {
    const field = document.createElement("div");
    field.className = "detail-metric";

    const labelEl = document.createElement("div");
    labelEl.className = "field-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("div");
    valueEl.className = "detail-metric-value";
    valueEl.textContent = value;

    field.appendChild(labelEl);
    field.appendChild(valueEl);

    if (subLabel) {
        const sub = document.createElement("div");
        sub.className = "detail-metric-sub";
        sub.textContent = subLabel;
        field.appendChild(sub);
    }

    return field;
}

function createInfoField(label: string, value: string): HTMLElement {
    const field = document.createElement("div");
    field.className = "detail-info-field";

    const labelEl = document.createElement("div");
    labelEl.className = "field-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("div");
    valueEl.className = "detail-info-value";
    valueEl.textContent = value;

    field.appendChild(labelEl);
    field.appendChild(valueEl);
    return field;
}

function getFinancialCategories(record: LoanRecord): FinancialCategory[] {
    return [
        { label: "Payroll", value: record.payroll },
        { label: "Utilities", value: record.utilities },
        { label: "Mortgage Interest", value: record.mortgageInterest },
        { label: "Health Care", value: record.healthCare },
        { label: "Rent", value: record.rent },
        { label: "Refinance EIDL", value: record.refinanceEidl },
        { label: "Debt Interest", value: record.debtInterest }
    ];
}

function findHighlightIndex(categories: FinancialCategory[]): number {
    let maxIndex = 0;
    let maxValue = -1;

    categories.forEach((category, index) => {
        const value = category.value ?? 0;
        if (value > maxValue) {
            maxValue = value;
            maxIndex = index;
        }
    });

    return maxValue > 0 ? maxIndex : -1;
}

export function renderDetailView(options: DetailViewOptions): void {
    const { container, record } = options;
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.className = "detail-view";

    const breadcrumb = document.createElement("button");
    breadcrumb.type = "button";
    breadcrumb.className = "breadcrumb";
    breadcrumb.textContent = "Home >";
    breadcrumb.dataset.action = "go-home";
    container.appendChild(breadcrumb);

    const title = document.createElement("h1");
    title.className = "detail-title";
    title.textContent = formatText(record.recipient) || "—";
    container.appendChild(title);

    const infoLink = document.createElement("div");
    infoLink.className = "detail-info-link";

    const infoIcon = document.createElement("span");
    infoIcon.className = "info-icon";
    infoIcon.textContent = "i";

    const infoText = document.createElement("span");
    infoText.textContent = "Why is my loan information here?";

    infoLink.appendChild(infoIcon);
    infoLink.appendChild(infoText);
    container.appendChild(infoLink);

    const metrics = document.createElement("div");
    metrics.className = "detail-metrics";

    const dateDetail = formatText(record.dateApprovedDetail) || formatText(record.dateApproved) || "—";

    metrics.appendChild(createMetricField("Loan Amount", formatCurrency(record.loanAmount)));
    metrics.appendChild(createMetricField("Amount Forgiven", formatCurrency(record.amountForgiven), "Includes any accrued interest"));
    metrics.appendChild(createMetricField("Location", formatText(record.location) || "—", formatText(record.locationType) || undefined));
    metrics.appendChild(createMetricField("Industry", formatText(record.industry) || "—"));
    metrics.appendChild(createMetricField("Date Approved", dateDetail));

    container.appendChild(metrics);

    const content = document.createElement("div");
    content.className = "detail-content";

    const leftColumn = document.createElement("div");
    leftColumn.className = "detail-left";

    const tableHeading = document.createElement("h2");
    tableHeading.className = "financial-heading";
    tableHeading.textContent = "Where applicants said the money will go";
    leftColumn.appendChild(tableHeading);

    const table = document.createElement("div");
    table.className = "financial-table";

    const categories = getFinancialCategories(record);
    const highlightIndex = findHighlightIndex(categories);

    categories.forEach((category, index) => {
        const row = document.createElement("div");
        row.className = "financial-row";
        if (index === highlightIndex) {
            row.classList.add("financial-row--highlight");
        }

        const name = document.createElement("span");
        name.className = "financial-label";
        name.textContent = category.label;

        const amount = document.createElement("span");
        amount.className = "financial-amount";
        amount.textContent = formatCurrency(category.value);

        row.appendChild(name);
        row.appendChild(amount);
        table.appendChild(row);
    });

    leftColumn.appendChild(table);
    content.appendChild(leftColumn);

    const rightColumn = document.createElement("div");
    rightColumn.className = "detail-right";

    rightColumn.appendChild(createInfoField("Lender", formatText(record.lender) || "—"));
    rightColumn.appendChild(createInfoField("Jobs Reported", formatNumber(record.jobsReported)));
    rightColumn.appendChild(createInfoField("Business Type", formatText(record.businessType) || "—"));
    rightColumn.appendChild(createInfoField("Business Age", formatText(record.businessAge) || "—"));
    rightColumn.appendChild(createInfoField("Loan Status", formatText(record.loanStatus) || "—"));

    content.appendChild(rightColumn);
    container.appendChild(content);
}
