import React from "react";
import { View } from "react-native";
import { SettingsContext } from "../components/SettingsContext";
import Colors from "../constants/Colors";

export function IndicatorBackgroundView() {
    return null;
    const { settings } = React.useContext(SettingsContext);
    return <View style={{
        height: 24, opacity: 50,
        backgroundColor: settings.dark ? Colors.darkListBackground : Colors.lightListBackground
    }} />;
}
