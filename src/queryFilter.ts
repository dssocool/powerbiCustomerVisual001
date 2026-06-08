"use strict";

import powerbi from "powerbi-visuals-api";
import { buildRoleIndexMap } from "./dataParser";
import { parseQuery } from "./searchEngine";

const SEARCH_COLUMN_ROLE = "searchColumn";

import DataView = powerbi.DataView;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import IFilter = powerbi.IFilter;

const ADVANCED_FILTER_SCHEMA = "https://powerbi.com/product/schema#advanced";
const SENTINEL_VALUE = "__PBI_VISUAL_INITIAL_NO_DATA__";

type FilterColumnTarget = { table: string; column: string };
type AdvancedFilterCondition = { operator: string; value: string };

interface AdvancedFilter extends IFilter {
    $schema: string;
    filterType: number;
    target?: FilterColumnTarget;
    logicalOperator: string;
    conditions: AdvancedFilterCondition[] | AdvancedFilter[];
}

function getColumnTarget(column: DataViewMetadataColumn): FilterColumnTarget | null {
    const queryName = column.queryName;
    if (!queryName) {
        return null;
    }

    // queryName is typically "Table.Column" (or wrapped in an aggregation, e.g. "Sum(Table.Column)")
    const innerMatch = queryName.match(/\(([^)]+)\)/);
    const path = innerMatch ? innerMatch[1] : queryName;
    const dotIndex = path.indexOf(".");

    if (dotIndex < 0) {
        return { table: path, column: column.displayName };
    }

    return {
        table: path.substring(0, dotIndex),
        column: path.substring(dotIndex + 1)
    };
}

function getSearchColumnTarget(dataView: DataView | undefined): FilterColumnTarget | null {
    if (!dataView?.table?.columns?.length) {
        return null;
    }

    const roleIndex = buildRoleIndexMap(dataView.table.columns);
    const colIndex = roleIndex.get(SEARCH_COLUMN_ROLE);
    if (colIndex === undefined) {
        return null;
    }

    return getColumnTarget(dataView.table.columns[colIndex]);
}

function buildColumnFilter(
    target: FilterColumnTarget,
    operator: string,
    value: string
): AdvancedFilter {
    return {
        $schema: ADVANCED_FILTER_SCHEMA,
        filterType: 0,
        target,
        logicalOperator: "And",
        conditions: [{ operator, value }]
    };
}

export function buildSentinelSelfFilter(dataView: DataView | undefined): IFilter | null {
    const target = getSearchColumnTarget(dataView);
    if (!target) {
        return null;
    }

    return buildColumnFilter(target, "Contains", SENTINEL_VALUE);
}

export function buildSearchSelfFilter(dataView: DataView | undefined, query: string): IFilter | null {
    const { exact, term } = parseQuery(query);
    if (!term) {
        return null;
    }

    const target = getSearchColumnTarget(dataView);
    if (!target) {
        return null;
    }

    return buildColumnFilter(target, exact ? "Is" : "Contains", term);
}
