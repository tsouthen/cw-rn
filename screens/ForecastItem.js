import React from "react";
import { Image, TouchableHighlight, LayoutAnimation, View } from "react-native";
import { Icon } from "../components/Icon";
import { SettingsContext } from "../components/SettingsContext";
import Colors from "../constants/Colors";
import CurrentLocation, { HeadingText, AutoUpdateText } from "./LocationScreen";

export function ForecastItem(props) {
    const { title, temperature, summary, icon, isNight, isOther, warning, warningUrl, index, heading, expanded, dateTime, value, precip } = props;
    const { settings } = React.useContext(SettingsContext);
    const [allowNight, setAllowNight] = React.useState(settings.night);
    const [rounded, setRounded] = React.useState(settings.round);
    const [isExpanded, setExpanded] = React.useState(expanded);

    React.useEffect(() => {
        setRounded(settings.round);
        setAllowNight(settings.night);
    }, [settings]);

    if (index > 1 && !allowNight && isNight && !isOther)
        return null;

    let imageView;
    if (typeof icon === "string") {
        imageView = <Image style={{ width: 50, height: 50, resizeMode: "contain" }} source={iconCodeToImage(icon, settings.dark)} />;
    } else if (!!icon && typeof icon === "object") {
        imageView = <Icon {...icon} size={32} iconStyle={{ width: 50, height: 50, paddingTop: 10, paddingLeft: 10 }} color={settings.dark ? "white" : "black"} />;
    } else if (!isOther) {
        // imageView = <View style={{ width: 50, height: 50 }} />;
        imageView = <Icon type="feather" name="cloud-off" size={28} iconStyle={{ width: 50, height: 50, paddingTop: 10, paddingLeft: 10 }} />;
    }
    let warningView = null;
    if (warning && warningUrl)
        warningView = (
            <TouchableHighlight style={{ alignSelf: 'flex-start' }} underlayColor='#ffffff' onPress={() => props.navigation.push("Warning", { url: warningUrl })}>
                <Text style={{ textDecorationLine: 'underline', fontSize: 13, color: Colors.primaryDark }}>{warning && isExpanded ? warning : ''}</Text>
            </TouchableHighlight>);

    let summmaryView = null;
    if (summary && isExpanded)
        summmaryView = (<Text style={{ fontSize: 13, flex: 1, color: settings.dark ? 'white' : 'black' }}>{summary}</Text>);

    let precipView = null;
    if (precip && isExpanded)
        precipView = (<Text style={{ fontSize: 13, flex: 1, color: settings.dark ? 'white' : 'black' }}>{precip}%</Text>);

    let fontColor = isNight ? '#777777' : (settings.dark ? 'white' : 'black');
    let fontWeight = props.fontWeight || isNight ? 'normal' : 'bold';
    // let fontWeight = 'normal';
    let displayTemp = temperature;
    if (displayTemp && displayTemp.length && rounded) {
        let tempVal = Number(displayTemp);
        if (!isNaN(tempVal))
            displayTemp = '' + Math.round(tempVal);
    }
    if (!displayTemp)
        fontWeight = 'normal';

    let headingView = null;
    let headingText = heading;
    if (!heading && !isOther) {
        if (index === 0) {
            headingText = "Conditions";
        } else if (index === 1) {
            headingText = "Forecast";
        }
        // if (headingText && dateTime) {
        //   headingText += ` (${getDateTimeString(dateTime)})`;
        // }
    }
    if (headingText)
        headingView = (<HeadingText text={headingText} />);

    let titleText = null;
    const titleTextStyle = { fontSize: 18, fontFamily: 'montserrat', flex: 1, color: fontColor };
    if (dateTime && index === 0)
        titleText = <AutoUpdateText style={titleTextStyle} dateTime={dateTime} interval={60000} navigation={props.navigation}>{title}</AutoUpdateText>;

    else
        titleText = <Text style={titleTextStyle}>{title}</Text>;

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!isExpanded);
    };
    return (
        <TouchableHighlight underlayColor={Colors.primaryLight} onPress={toggleExpanded}
            style={{
                marginLeft: 5, marginRight: 5,
                marginTop: headingText ? (index ? 7 : 5) : 5,
                // marginBottom: isNight && !isOther ? 2 : 0,
                borderRadius: 8, overflow: 'hidden'
            }}
        >
            <View style={{
                flex: 100, flexDirection: "column",
                backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground,
            }}>
                {/* {index === 0 && <Divider />} */}
                {headingView}
                <View style={{ flex: 100, flexDirection: "row", paddingTop: 0, paddingBottom: 5, paddingRight: 5, alignItems: summary || warning ? "flex-start" : "center" }}>
                    {imageView}
                    <View style={{ flex: 1, flexDirection: "column", paddingLeft: 10, paddingTop: 5 }}>
                        <View style={{ flexDirection: "row" }}>
                            {titleText}
                            <Text style={{ fontSize: 18, fontWeight: fontWeight, color: fontColor }}>{displayTemp ? displayTemp + '°' : value ?? ''}</Text>
                        </View>
                        {summmaryView}
                        {precipView}
                        {warningView}
                    </View>
                </View>
                {/* <Divider /> */}
                {/* <View style={{ height: 1, backgroundColor: settings.dark ? '#777777' : '#eeeeee' }} /> */}
            </View>
        </TouchableHighlight>);
} export function iconCodeToImage(iconCode, isDark) {
    if (!CurrentLocation.isString(iconCode)) {
        // console.debug('Non-string icon code: ' + iconCode);
        // return require('../assets/images/light/clever_weather.png');
        return null;
    }
    const codeNum = Number(iconCode.trim());
    if (!isNaN(codeNum))
        iconCode = codeNum;

    switch (iconCode) {
        case "sunrise":
            return isDark ? require('../assets/images/dark/sunrise.png') : require('../assets/images/light/sunrise.png');
        case "sunset":
            return isDark ? require('../assets/images/dark/sunset.png') : require('../assets/images/light/sunset.png');
        case "thermometer_min":
            return isDark ? require('../assets/images/dark/thermometer_min.png') : require('../assets/images/light/thermometer_min.png');
        case "thermometer_max":
            return isDark ? require('../assets/images/dark/thermometer_max.png') : require('../assets/images/light/thermometer_max.png');
        case "thermometer_mean":
            return isDark ? require('../assets/images/dark/thermometer_mean.png') : require('../assets/images/light/thermometer_mean.png');
        case 0: //sun
            return isDark ? require('../assets/images/dark/sun.png') : require('../assets/images/light/sun.png');
        case 1: //little clouds
            return isDark ? require('../assets/images/dark/sun_cloud.png') : require('../assets/images/light/sun_cloud.png');
        case 4: //increasing cloud
            return isDark ? require('../assets/images/dark/sun_cloud_increasing.png') : require('../assets/images/light/sun_cloud_increasing.png');
        case 5: //decreasing cloud
        case 20: //decreasing cloud
            return isDark ? require('../assets/images/dark/sun_cloud_decreasing.png') : require('../assets/images/light/sun_cloud_decreasing.png');
        case 2: //big cloud with sun
        case 3: //sun behind big cloud
        case 22: //big cloud with sun
            return isDark ? require('../assets/images/dark/cloud_sun.png') : require('../assets/images/light/cloud_sun.png');
        case 6: //rain with sun behind cloud
            return isDark ? require('../assets/images/dark/cloud_drizzle_sun_alt.png') : require('../assets/images/light/cloud_drizzle_sun_alt.png');
        case 7: //rain and snow with sun behind cloud
        case 8: //snow with sun behind cloud
            return isDark ? require('../assets/images/dark/cloud_snow_sun_alt.png') : require('../assets/images/light/cloud_snow_sun_alt.png');
        case 9: //cloud rain lightning
            return isDark ? require('../assets/images/dark/cloud_lightning_sun.png') : require('../assets/images/light/cloud_lightning_sun.png');
        case 10: //cloud
            return isDark ? require('../assets/images/dark/cloud.png') : require('../assets/images/light/cloud.png');
        case 11:
        case 28:
            return isDark ? require('../assets/images/dark/cloud_drizzle_alt.png') : require('../assets/images/light/cloud_drizzle_alt.png');
        case 12:
            return isDark ? require('../assets/images/dark/cloud_drizzle.png') : require('../assets/images/light/cloud_drizzle.png');
        case 13:
            return isDark ? require('../assets/images/dark/cloud_rain.png') : require('../assets/images/light/cloud_rain.png');
        case 15:
        case 16:
        case 17:
        case 18:
            return isDark ? require('../assets/images/dark/cloud_snow_alt.png') : require('../assets/images/light/cloud_snow_alt.png');
        case 19:
            return isDark ? require('../assets/images/dark/cloud_lightning.png') : require('../assets/images/light/cloud_lightning.png');
        case 23:
        case 24:
        case 44:
            return isDark ? require('../assets/images/dark/cloud_fog.png') : require('../assets/images/light/cloud_fog.png');
        case 25:
        case 45:
            return isDark ? require('../assets/images/dark/cloud_wind.png') : require('../assets/images/light/cloud_wind.png');
        case 14: //freezing rain
        case 26: //ice
        case 27: //hail
            return isDark ? require('../assets/images/dark/cloud_hail.png') : require('../assets/images/light/cloud_hail.png');
        case 30:
            return isDark ? require('../assets/images/dark/moon.png') : require('../assets/images/light/moon.png');
        case 31:
        case 32:
        case 33:
            return isDark ? require('../assets/images/dark/cloud_moon.png') : require('../assets/images/light/cloud_moon.png');
        case 21:
        case 34:
            return isDark ? require('../assets/images/dark/cloud_moon_increasing.png') : require('../assets/images/light/cloud_moon_increasing.png');
        case 35:
            return isDark ? require('../assets/images/dark/cloud_moon_decreasing.png') : require('../assets/images/light/cloud_moon_decreasing.png');
        case 36:
            return isDark ? require('../assets/images/dark/cloud_drizzle_moon_alt.png') : require('../assets/images/light/cloud_drizzle_moon_alt.png');
        case 37:
        case 38:
            return isDark ? require('../assets/images/dark/cloud_snow_moon_alt.png') : require('../assets/images/light/cloud_snow_moon_alt.png');
        case 39:
            return isDark ? require('../assets/images/dark/cloud_lightning_moon.png') : require('../assets/images/light/cloud_lightning_moon.png');
    }
    // console.debug('Unknown icon code: ' + iconCode);
    // return require('../assets/images/light/clever_weather.png');
    return null;
}

