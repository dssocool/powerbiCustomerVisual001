"use strict";

import powerbi from "powerbi-visuals-api";
import { buildRoleIndexMap } from "./dataParser";
import { parseQuery, SEARCHABLE_FIELDS } from "./searchEngine";

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

    const dotIndex = queryName.indexOf(".");
    const table = dotIndex >= 0 ? queryName.substring(0, dotIndex) : queryName;
    return { table, column: column.displayName };
}

function getSearchableTargets(dataView: DataView | undefined): FilterColumnTarget[] {
    if (!dataView?.table?.columns?.length) {
        return [];
    }

    const roleIndex = buildRoleIndexMap(dataView.table.columns);
    const targets: FilterColumnTarget[] = [];

    SEARCHABLE_FIELDS.forEach(role => {
        const colIndex = roleIndex.get(role);
        if (colIndex === undefined) {
            return;
        }

        const target = getColumnTarget(dataView.table.columns[colIndex]);
        if (target) {
            targets.push(target);
        }
    });

    return targets;
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
    const targets = getSearchableTargets(dataView);
    if (targets.length === 0) {
        return null;
    }

    return buildColumnFilter(targets[0], "Contains", SENTINEL_VALUE);
}

export function buildSearchSelfFilter(dataView: DataView | undefined, query: string): IFilter | null {
    const { exact, term } = parseQuery(query);
    if (!term) {
        return null;
    }

    const targets = getSearchableTargets(dataView);
    if (targets.length === 0) {
        return null;
    }

    const operator = exact ? "Is" : "Contains";

    if (targets.length === 1) {
        return buildColumnFilter(targets[0], operator, term);
    }

    return {
        $schema: ADVANCED_FILTER_SCHEMA,
        filterType: 0,
        logicalOperator: "Or",
        conditions: targets.map(target => buildColumnFilter(target, operator, term))
    };
}
