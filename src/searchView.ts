"use strict";

import { LoanRecord, VisualSettings } from "./types";
import { formatText } from "./formatUtils";

export interface SearchViewOptions {
    container: HTMLElement;
    settings: VisualSettings;
    searchQuery: string;
    results: LoanRecord[];
    hasData: boolean;
    hasSearched: boolean;
    isLoading: boolean;
}

function createField(label: string, value: string, className?: string): HTMLElement {
    const field = document.createElement("div");
    field.className = "result-field";

    const labelEl = document.createElement("div");
    labelEl.className = "field-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("div");
    valueEl.className = className ? `field-value ${className}` : "field-value";
    valueEl.textContent = value;

    field.appendChild(labelEl);
    field.appendChild(valueEl);
    return field;
}

function createRecipientField(record: LoanRecord): HTMLElement {
    const field = document.createElement("div");
    field.className = "result-field";

    const labelEl = document.createElement("div");
    labelEl.className = "field-label";
    labelEl.textContent = "Recipient";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-recipient-link";
    button.textContent = formatText(record.recipient).toUpperCase() || "—";
    button.dataset.action = "open-detail";
    button.dataset.recordIndex = String(record.index);

    field.appendChild(labelEl);
    field.appendChild(button);
    return field;
}

function createResultRow(record: LoanRecord): HTMLElement {
    const row = document.createElement("div");
    row.className = "result-row";

    row.appendChild(createRecipientField(record));
    row.appendChild(createField("Location", formatText(record.location) || "—"));
    row.appendChild(createField("Loan Status", formatText(record.loanStatus) || "—"));
    row.appendChild(createField("Loan Amount", formatText(record.loanAmount) || "—"));
    row.appendChild(createField("Date Approved", formatText(record.dateApproved) || "—"));

    return row;
}

export function renderSearchView(options: SearchViewOptions): void {
    const { container, settings, searchQuery, results, hasData, hasSearched, isLoading } = options;
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.className = "search-view";

    const header = document.createElement("div");
    header.className = "search-header";

    const subtitle = document.createElement("div");
    subtitle.className = "search-subtitle";
    subtitle.textContent = settings.subtitle;

    const title = document.createElement("h1");
    title.className = "search-title";
    title.textContent = settings.title;

    header.appendChild(subtitle);
    header.appendChild(title);
    container.appendChild(header);

    const panel = document.createElement("div");
    panel.className = "search-panel";
    panel.style.backgroundColor = settings.panelBackgroundColor;

    const instruction = document.createElement("p");
    instruction.className = "search-instruction";
    instruction.textContent = settings.instructionText;
    panel.appendChild(instruction);

    const searchBar = document.createElement("div");
    searchBar.className = "search-bar";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "search-input";
    input.value = searchQuery;
    input.placeholder = "Search...";
    input.dataset.action = "search-input";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-button";
    button.textContent = "Search";
    button.style.backgroundColor = settings.buttonColor;
    button.dataset.action = "search-submit";

    searchBar.appendChild(input);
    searchBar.appendChild(button);
    panel.appendChild(searchBar);

    const examples = document.createElement("div");
    examples.className = "search-examples";

    const exampleLabel = document.createElement("span");
    exampleLabel.className = "search-examples-label";
    exampleLabel.textContent = "For example: ";
    examples.appendChild(exampleLabel);

    settings.exampleTerms.forEach((term, index) => {
        if (index > 0) {
            examples.appendChild(document.createTextNode(", "));
        }
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "search-example-chip";
        chip.textContent = term;
        chip.dataset.action = "search-example";
        chip.dataset.term = term;
        examples.appendChild(chip);
    });

    panel.appendChild(examples);
    container.appendChild(panel);

    if (!hasData) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Map Search Column (searchtext) to begin searching.";
        container.appendChild(empty);
        return;
    }

    if (!hasSearched) {
        return;
    }

    if (isLoading && results.length === 0) {
        const loading = document.createElement("div");
        loading.className = "search-loading";
        loading.textContent = "Searching...";
        container.appendChild(loading);
        return;
    }

    const summary = document.createElement("div");
    summary.className = "results-summary";

    const count = document.createElement("div");
    count.className = "results-count";
    const loanWord = results.length === 1 ? "loan" : "loans";
    count.textContent = isLoading
        ? `Searching... ${results.length} ${loanWord} found so far`
        : `${results.length} ${loanWord} found`;

    const tip = document.createElement("div");
    tip.className = "results-tip";
    tip.textContent = "If you're looking for an exact term, try adding quotes, e.g., 'farm market'";

    summary.appendChild(count);
    summary.appendChild(tip);
    container.appendChild(summary);

    const list = document.createElement("div");
    list.className = "results-list";

    if (results.length === 0) {
        const noResults = document.createElement("div");
        noResults.className = "no-results";
        noResults.textContent = "No loans match your search.";
        list.appendChild(noResults);
    } else {
        results.forEach(record => list.appendChild(createResultRow(record)));
    }

    container.appendChild(list);
}
