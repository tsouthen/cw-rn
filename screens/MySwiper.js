import React from "react";
import { LayoutAnimation } from "react-native";
import Swiper from "react-native-swiper";
import Colors from "../constants/Colors";
import Layout from "../constants/Layout";

export function MySwiper({ startPage, pages }) {
    const [touching, setTouching] = React.useState(false);

    return <Swiper loop={false} index={startPage} activeDotColor={Colors.primaryDark}
        showsPagination={true}
        // showsButtons={touching}
        paginationStyle={{
            top: 4,
            // backgroundColor: touching ? Colors.lightListBackground + '80' : undefined,
            // backgroundColor: 'red',
            left: (Layout.window.width / 2) - 35,
            width: 70, height: 27, borderRadius: 50,
        }}
        onTouchStart={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setTouching(true);
        }}
        onTouchEnd={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setTouching(false);
        }}
    >
        {pages}
    </Swiper>;

}
