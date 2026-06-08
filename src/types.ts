"use strict";

export type ViewMode = "search" | "detail";

export interface LoanRecord {
    index: number;
    loanNumber: string;
    recipient: string;
    location: string;
    loanStatus: string;
    loanAmount: string;
    dateApproved: string;
    lender: string;
    businessType: string;
    amountForgiven: string;
    locationType: string;
    industry: string;
    dateApprovedDetail: string;
    payroll: string;
    utilities: string;
    mortgageInterest: string;
    healthCare: string;
    rent: string;
    refinanceEidl: string;
    debtInterest: string;
    jobsReported: string;
    businessAge: string;
    payrollRaw: number | null;
    utilitiesRaw: number | null;
    mortgageInterestRaw: number | null;
    healthCareRaw: number | null;
    rentRaw: number | null;
    refinanceEidlRaw: number | null;
    debtInterestRaw: number | null;
}

export interface FinancialCategory {
    label: string;
    displayValue: string;
    rawValue: number | null;
}

export interface VisualSettings {
    subtitle: string;
    title: string;
    instructionText: string;
    panelBackgroundColor: string;
    buttonColor: string;
    exampleTerms: string[];
    fontSize: number;
}

export const DEFAULT_SETTINGS: VisualSettings = {
    subtitle: "Tracking PPP",
    title: "Search Every Company Approved for Federal Loans",
    instructionText: "Search for PPP loan applications by organization, lender, zip code and business type.",
    panelBackgroundColor: "#eef4ff",
    buttonColor: "#6b427b",
    exampleTerms: ["trucking", "hospice", "90210", "restaurant", "construction"],
    fontSize: 14
};
