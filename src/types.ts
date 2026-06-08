"use strict";

export type ViewMode = "search" | "detail";

export interface LoanRecord {
    index: number;
    recipient: string;
    location: string;
    loanStatus: string;
    loanAmount: number | null;
    dateApproved: string;
    lender: string;
    zipCode: string;
    businessType: string;
    amountForgiven: number | null;
    locationType: string;
    industry: string;
    dateApprovedDetail: string;
    payroll: number | null;
    utilities: number | null;
    mortgageInterest: number | null;
    healthCare: number | null;
    rent: number | null;
    refinanceEidl: number | null;
    debtInterest: number | null;
    jobsReported: number | null;
    businessAge: string;
}

export interface FinancialCategory {
    label: string;
    value: number | null;
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
