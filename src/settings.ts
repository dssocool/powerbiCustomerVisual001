"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { DEFAULT_SETTINGS, VisualSettings } from "./types";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class HeaderCardSettings extends FormattingSettingsCard {
    subtitle = new formattingSettings.TextInput({
        name: "subtitle",
        displayName: "Subtitle",
        placeholder: "Tracking PPP",
        value: DEFAULT_SETTINGS.subtitle
    });

    title = new formattingSettings.TextInput({
        name: "title",
        displayName: "Title",
        placeholder: "Search Every Company Approved for Federal Loans",
        value: DEFAULT_SETTINGS.title
    });

    name = "header";
    displayName = "Header";
    slices: Array<FormattingSettingsSlice> = [this.subtitle, this.title];
}

class SearchCardSettings extends FormattingSettingsCard {
    instructionText = new formattingSettings.TextInput({
        name: "instructionText",
        displayName: "Instruction text",
        placeholder: DEFAULT_SETTINGS.instructionText,
        value: DEFAULT_SETTINGS.instructionText
    });

    panelBackgroundColor = new formattingSettings.ColorPicker({
        name: "panelBackgroundColor",
        displayName: "Panel background",
        value: { value: DEFAULT_SETTINGS.panelBackgroundColor }
    });

    buttonColor = new formattingSettings.ColorPicker({
        name: "buttonColor",
        displayName: "Search button color",
        value: { value: DEFAULT_SETTINGS.buttonColor }
    });

    exampleTerms = new formattingSettings.TextInput({
        name: "exampleTerms",
        displayName: "Example terms (comma-separated)",
        placeholder: "trucking, hospice, 90210",
        value: DEFAULT_SETTINGS.exampleTerms.join(", ")
    });

    name = "search";
    displayName = "Search";
    slices: Array<FormattingSettingsSlice> = [
        this.instructionText,
        this.panelBackgroundColor,
        this.buttonColor,
        this.exampleTerms
    ];
}

class TypographyCardSettings extends FormattingSettingsCard {
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Base font size",
        value: DEFAULT_SETTINGS.fontSize
    });

    name = "typography";
    displayName = "Typography";
    slices: Array<FormattingSettingsSlice> = [this.fontSize];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    headerCard = new HeaderCardSettings();
    searchCard = new SearchCardSettings();
    typographyCard = new TypographyCardSettings();

    cards = [this.headerCard, this.searchCard, this.typographyCard];
}

export function getVisualSettings(model: VisualFormattingSettingsModel): VisualSettings {
    const exampleTermsRaw = model.searchCard.exampleTerms.value || DEFAULT_SETTINGS.exampleTerms.join(", ");
    const exampleTerms = exampleTermsRaw
        .split(",")
        .map(term => term.trim())
        .filter(term => term.length > 0);

    return {
        subtitle: model.headerCard.subtitle.value || DEFAULT_SETTINGS.subtitle,
        title: model.headerCard.title.value || DEFAULT_SETTINGS.title,
        instructionText: model.searchCard.instructionText.value || DEFAULT_SETTINGS.instructionText,
        panelBackgroundColor: model.searchCard.panelBackgroundColor.value?.value || DEFAULT_SETTINGS.panelBackgroundColor,
        buttonColor: model.searchCard.buttonColor.value?.value || DEFAULT_SETTINGS.buttonColor,
        exampleTerms: exampleTerms.length > 0 ? exampleTerms : DEFAULT_SETTINGS.exampleTerms,
        fontSize: model.typographyCard.fontSize.value || DEFAULT_SETTINGS.fontSize
    };
}
