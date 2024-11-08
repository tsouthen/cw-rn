import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function LocationSafeAreaView({ isCurrent, children }) {
    const insets = useSafeAreaInsets();

    return <View style={{ flex: 1, paddingBottom: isCurrent ? 0 : insets.bottom }}>
        {children}
    </View>;
}
