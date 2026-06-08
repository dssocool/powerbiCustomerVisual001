/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { hasBoundData, parseLoanRecords } from "./dataParser";
import { renderDetailView } from "./detailView";
import {
    buildBlockingSelfFilter,
    buildSearchSelfFilter,
    desiredFilterKind,
    FilterKind
} from "./queryFilter";
import { normalizeSearchInput } from "./searchEngine";
import { renderSearchView } from "./searchView";
import { getVisualSettings, VisualFormattingSettingsModel } from "./settings";
import { LoanRecord, ViewMode, VisualSettings } from "./types";

export class Visual implements IVisual {
    private host: IVisualHost;
    private events: IVisualEventService;
    private target: HTMLElement;
    private root: HTMLElement;
    private content: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private viewMode: ViewMode = "search";
    private searchQuery = "";
    private selectedRecordIndex: number | null = null;
    private allRecords: LoanRecord[] = [];
    private filteredRecords: LoanRecord[] = [];
    private visualSettings: VisualSettings;
    private hasData = false;
    private lastDataSignature = "";
    private lastDataView: powerbi.DataView | undefined;
    private hasSearched = false;
    private isLoading = false;
    private lastAppliedFilterKind: FilterKind = "none";
    private lastAppliedSearchTerm = "";

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.visualSettings = getVisualSettings(new VisualFormattingSettingsModel());

        this.root = document.createElement("div");
        this.root.className = "visual-root";
        this.content = document.createElement("div");
        this.root.appendChild(this.content);
        this.target.appendChild(this.root);

        this.root.addEventListener("click", this.handleClick.bind(this));
        this.root.addEventListener("keydown", this.handleKeydown.bind(this));
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);

        try {
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel,
                options.dataViews?.[0]
            );
            this.visualSettings = getVisualSettings(this.formattingSettings);

            const dataView = options.dataViews?.[0];
            this.lastDataView = dataView;
            this.hasData = hasBoundData(dataView);

            if (!this.hasSearched) {
                this.ensureSelfFilter(dataView);
                this.filteredRecords = [];
                this.applyViewport(options.viewport.width, options.viewport.height);
                this.render();
                this.events.renderingFinished(options);
                return;
            }

            const newRecords = parseLoanRecords(dataView);
            const newSignature = this.buildDataSignature(newRecords);

            if (newSignature !== this.lastDataSignature) {
                this.allRecords = newRecords;
                this.lastDataSignature = newSignature;
                if (this.selectedRecordIndex !== null && !this.allRecords.some(r => r.index === this.selectedRecordIndex)) {
                    this.selectedRecordIndex = null;
                    this.viewMode = "search";
                }
            }

            this.filteredRecords = this.allRecords;
            this.isLoading = false;

            this.applyViewport(options.viewport.width, options.viewport.height);
            this.render();

            this.events.renderingFinished(options);
        } catch (error) {
            this.events.renderingFailed(options, String(error));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private ensureSelfFilter(dataView: powerbi.DataView | undefined): void {
        if (!this.hasData) {
            return;
        }

        const kind = desiredFilterKind(this.hasSearched, this.searchQuery);
        if (kind === "block") {
            const filter = buildBlockingSelfFilter(dataView);
            this.applySelfFilter("block", filter);
        }
    }

    private applySelfFilter(kind: FilterKind, filter: powerbi.IFilter | null, searchTerm = ""): void {
        if (
            kind === this.lastAppliedFilterKind &&
            (kind !== "search" || searchTerm === this.lastAppliedSearchTerm)
        ) {
            return;
        }

        this.host.applyJsonFilter(null, "general", "selfFilter", powerbi.FilterAction.remove);
        if (filter) {
            this.host.applyJsonFilter(filter, "general", "selfFilter", powerbi.FilterAction.merge);
        }

        this.lastAppliedFilterKind = kind;
        this.lastAppliedSearchTerm = searchTerm;
    }

    private submitSearch(query: string): void {
        const normalizedQuery = normalizeSearchInput(query);
        this.searchQuery = normalizedQuery;

        if (!normalizedQuery) {
            this.hasSearched = false;
            this.isLoading = false;
            this.allRecords = [];
            this.filteredRecords = [];
            this.lastDataSignature = "";
            this.viewMode = "search";

            const blockFilter = buildBlockingSelfFilter(this.lastDataView);
            this.applySelfFilter("block", blockFilter);
            this.render();
            return;
        }

        this.hasSearched = true;
        this.isLoading = true;
        this.viewMode = "search";
        this.allRecords = [];
        this.filteredRecords = [];
        this.lastDataSignature = "";

        const filter = buildSearchSelfFilter(this.lastDataView, normalizedQuery);
        if (filter) {
            this.applySelfFilter("search", filter, normalizedQuery);
        } else {
            this.isLoading = false;
        }

        this.render();
    }

    private applyViewport(width: number, height: number): void {
        this.root.style.width = `${width}px`;
        this.root.style.height = `${height}px`;
        this.root.style.fontSize = `${this.visualSettings.fontSize}px`;
    }

    private render(): void {
        if (this.viewMode === "detail" && this.selectedRecordIndex !== null) {
            const record = this.allRecords.find(r => r.index === this.selectedRecordIndex);
            if (record) {
                renderDetailView({ container: this.content, record });
                return;
            }
            this.viewMode = "search";
            this.selectedRecordIndex = null;
        }

        renderSearchView({
            container: this.content,
            settings: this.visualSettings,
            searchQuery: this.searchQuery,
            results: this.filteredRecords,
            hasData: this.hasData,
            hasSearched: this.hasSearched,
            isLoading: this.isLoading
        });
    }

    private handleClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const actionElement = target.closest("[data-action]") as HTMLElement | null;
        if (!actionElement) {
            return;
        }

        const action = actionElement.dataset.action;

        switch (action) {
            case "search-submit": {
                const input = this.root.querySelector<HTMLInputElement>(".search-input");
                if (input) {
                    this.submitSearch(input.value);
                }
                break;
            }
            case "search-example": {
                const term = actionElement.dataset.term ?? "";
                this.submitSearch(term);
                break;
            }
            case "open-detail": {
                const index = Number(actionElement.dataset.recordIndex);
                if (!isNaN(index)) {
                    this.selectedRecordIndex = index;
                    this.viewMode = "detail";
                    this.render();
                }
                break;
            }
            case "go-home": {
                this.viewMode = "search";
                this.selectedRecordIndex = null;
                this.render();
                break;
            }
        }
    }

    private handleKeydown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement;
        if (target.classList.contains("search-input") && event.key === "Enter") {
            event.preventDefault();
            this.submitSearch((target as HTMLInputElement).value);
        }
    }

    private buildDataSignature(records: LoanRecord[]): string {
        if (records.length === 0) {
            return "empty";
        }
        const first = records[0];
        const last = records[records.length - 1];
        return `${records.length}|${first.loanNumber}|${last.loanNumber}`;
    }
}
