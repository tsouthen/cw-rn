import React from "react";
import { LayoutAnimation } from "react-native";
import { HeaderBarAction } from "../components/HeaderBar";
import { SettingsContext } from "../components/SettingsContext";

export function NightForecastsIcon(props) {
    const { settings, updateSetting } = React.useContext(SettingsContext);
    return <HeaderBarAction type="ionicon" name={settings.night ? "moon" : "moon-outline"}
        onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            updateSetting("night", !settings.night);
        }} />;
}
