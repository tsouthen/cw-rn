import Constants from 'expo-constants';
import * as Location from 'expo-location';
import React from 'react';
import { ActivityIndicator, FlatList, Image, LayoutAnimation, Linking, Platform, StyleSheet, Text, TouchableHighlight, View, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Portal, Snackbar, useTheme } from 'react-native-paper';
import { parseString } from 'react-native-xml2js';
import Swiper from 'react-native-swiper';
import { FavoritesContext } from '../components/FavoritesContext';
import { SettingsContext } from '../components/SettingsContext';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import sitelocations from '../constants/sitelocations';
import CityListScreen from './CityListScreen';
import HeaderBar, { HeaderBarAction, HeaderBarShareAction } from '../components/HeaderBar';
import { Icon } from '../components/Icon';
import { getAsOfLabel, loadWeatherOffice } from "../extractor";

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 15,
//     backgroundColor: '#fff',
//   },
//   title: {
//     color: 'white',
//     fontWeight: 'normal',
//     fontSize: 18,
//     fontFamily: 'montserrat',
//     backgroundColor: Colors.primary,
//     padding: 5
//   },
// });

function diffInMinutes(date1, date2) {
  const date1Time = new Date(date1).getTime();
  const date2Time = new Date(date2).getTime();
  const diffInMilliseconds = date2Time - date1Time;
  return Math.floor(diffInMilliseconds / (1000 * 60));
}

export default class CurrentLocation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lastFetch: undefined,
      isLoading: true,
      dataSource: {
        forecasts: [],
        nearestSites: [],
        hourlyData: [],
        yesterday: [],
        almanac: [],
        sunRiseSet: [],
      },
      subtitle: null,
    }
  };

  possiblyRefreshData() {
    const forecasts = this.state.dataSource.forecasts;
    const lastFetch = this.state.lastFetch;
    // determine if a new xml file will be available:
    //   now - lastFetch > 5 mins &&
    //   now - lastForecastDateTime > 65 mins
    if (!this.state.isLoading && lastFetch && forecasts && forecasts.length > 0 && forecasts[0].dateTime) {
      const now = Date.now();
      let lastFetchMins = diffInMinutes(now, lastFetch);
      let lastForecastMins = diffInMinutes(now, forecasts[0].dateTime);

      if (lastFetchMins >= 5 && lastForecastMins >= 65) {
        console.log("refreshing old data");
        this.makeRemoteRequest();
      } else {
        console.log(`Not refreshing data, lastFetch:${lastFetchMins}, lastForecast:${lastForecastMins}`);
      }
    } else {
      console.log("No data to refresh");
      console.log(`  lastFetch:${lastFetch}`);
      console.log(`  num forecasts:${forecasts.length}`);
      if (forecasts.length > 0)
        console.log(`  last dateTime:${forecasts[0].dateTime}`);
    }
  }

  handleAppStateChange = nextAppState => {
    if (nextAppState === "active") {
      this.possiblyRefreshData();
    }
  };

  async componentDidMount() {
    if (this.state.isLoading) {
      console.log("requesting remote data");
      await this.makeRemoteRequest();
    }

    this.subscription = AppState.addEventListener('change', this.handleAppStateChange);

    this.unsubscribeFocusSubscription = this.props.navigation.addListener('focus', (payLoad) => {
      this.possiblyRefreshData();
    });
  };

  componentWillUnmount() {
    if (this.unsubscribeFocusSubscription)
      this.unsubscribeFocusSubscription();

    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  randomInRange = (start, end) => {
    return start + ((end - start) * Math.random());
  };

  randomIntInRange = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  fetchXML = async (url) => {
    return await (await fetch(url)).text();
  }

  jsonFromXml = (xml) => {
    return new Promise((resolve, reject) => {
      parseString(xml, { explicitArray: false, mergeAttrs: true, explicitRoot: false }, (err, result) => {
        if (err)
          reject(err);
        else
          resolve(result);
      });
    });
  };

  orderByDistance = function (point, coords) {
    return coords.sort((a, b) => this.getDistanceSquared(point, a) - this.getDistanceSquared(point, b));
  };

  getDistanceSquared = function (a, b) {
    return Math.pow(b.longitude - a.longitude, 2) + Math.pow(b.latitude - a.latitude, 2);
  };

  makeRemoteRequest = async () => {
    try {
      let sortedLocs = [];

      const { navigation, route } = this.props;
      let nearest = route?.params?.site;
      if (!nearest) {
        let location;
        if (Platform.OS === 'android' && !Constants.isDevice) {
          nearest = sitelocations[this.randomIntInRange(0, sitelocations.length)];
          location = { coords: { latitude: nearest.latitude, longitude: nearest.longitude } };
        } else {
          await Location.requestForegroundPermissionsAsync();
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest, maximumAge: 15 * 60 * 1000, timeout: 30 * 1000 });
        }
        sortedLocs = this.orderByDistance(location.coords, sitelocations);
        sortedLocs = sortedLocs.slice(0, 10);
        // console.debug(sortedLocs);
        nearest = sortedLocs[0]; //findNearest(location.coords, sitelocations);
      }

      let site = 's0000047'; //Calgary
      let prov = 'AB';
      // site = 's0000656'; //Comox
      // prov = 'BC';
      // nearest = undefined;
      if (nearest) {
        // console.debug(nearest);
        site = nearest.site;
        prov = nearest.prov;
      }

      let targetUrl = 'https://dd.weather.gc.ca/citypage_weather/xml/' + prov + '/' + site + '_e.xml';
      // console.debug('targetUrl: ' + targetUrl);
      const xml = await this.fetchXML(targetUrl);
      const responseJson = await this.jsonFromXml(xml);
      // console.debug(JSON.stringify(responseJson));
      const result = loadWeatherOffice(responseJson);
      const { forecast: entries, hourly: hourlyData, yesterday, almanac, sun: sunRiseSet } = result;

      navigation.setParams({
        location: responseJson.location.name._,
        currentSite: nearest,
      });

      this.setState({
        lastFetch: Date.now(),
        isLoading: false,
        dataSource: {
          forecasts: entries,
          nearestSites: sortedLocs,
          hourlyData,
          yesterday,
          almanac,
          sunRiseSet,
        },
        subtitle: "Daily Forecast",
      });
    } catch (error) {
      console.error(error);
    }
  };

  static isString = (item) => {
    return item !== null && item !== undefined && 'string' === typeof (item);
  };

  handleRefresh = () => {
    if (this.state.isLoading)
      return;

    const { navigation, route } = this.props;
    if (!route?.params?.site) {
      navigation.setParams({ location: 'Location', currentSite: undefined, subtitle: null });
    }
    this.setState({ isLoading: true }, () => { this.makeRemoteRequest(); });
  };

  newFlatList = (data) => {
    return (
      <FlatList
        style={{ flex: 1, backgroundColor: this.context.settings.dark ? Colors.darkListBackground : Colors.lightListBackground }}
        data={data}
        renderItem={({ item, index }) => <ForecastItem {...item}
          navigation={this.props.navigation}
          index={index}
          onPress={() => {
            //we need the expanded state outside the ForecastItem as the FlatList is a virtualized list and items can be re-used
            item.expanded = !item.expanded;
            this.setState({ dataSource: this.state.dataSource });
          }} />}
        keyExtractor={(item) => {
          let key = item.title;
          if (item.temperature)
            key += item.temperature;
          else if (item.value)
            key += item.value;
          else if (item.summary)
            key += item.summary;
          return key;
        }}
        refreshing={this.state.isLoading}
        onRefresh={this.handleRefresh}
      />
    );
  };

  render() {
    const { navigation, route } = this.props;
    const isCurrLocation = !route?.params?.site;
    // const hasLocation = !isCurrLocation || route?.params?.currentSite;
    const site = route?.params?.site || route?.params?.currentSite;
    // const subtitle = route?.params?.location ? this.state.subtitle : null;

    const headerBar = (
      <HeaderBar navigation={navigation} title={route?.params?.location ?? 'Location'} showBackButton={!isCurrLocation} /* subtitle={subtitle} */ >
        {site && <FavoriteIcon site={site} />}
        {site && <NightForecastsIcon />}
        {isCurrLocation && <MenuIcon navigation={navigation} />}
        {/* {site && <SettingsIcon navigation={navigation} />} */}
        {/* {hasLocation && <HeaderBarShareAction />} */}
      </HeaderBar>);

    if (this.state.isLoading) {
      return (
        <View style={{ flex: 1 }}>
          {headerBar}
          <View style={{ flex: 1, marginTop: 80 }}>
            <ActivityIndicator color={Colors.primaryDark} />
          </View>
        </View>
      )
    }

    let startPage = 0;
    let pages = [
      (<View key="1" style={{ flex: 1 }}>
        {this.newFlatList(this.state.dataSource.forecasts)}
        <IndicatorBackgroundView />
      </View>),
      (<View key="2" style={{ flex: 1 }}>
        {this.newFlatList(this.state.dataSource.hourlyData)}
        <IndicatorBackgroundView />
      </View>)
    ];

    if (this.state.dataSource.nearestSites && this.state.dataSource.nearestSites.length) {
      startPage = 1;
      pages.splice(0, 0,
        <View key="3" style={{ flex: 1 }}>
          <HeadingText text="Nearby" />
          <CityListScreen
            cities={this.state.dataSource.nearestSites}
            navigation={this.props.navigation}
            refreshing={this.state.isLoading}
            onRefresh={this.handleRefresh}
          />
          <IndicatorBackgroundView />
        </View>);
    }

    let otherEntries = [];
    if (this.state.dataSource.sunRiseSet && this.state.dataSource.sunRiseSet.length)
      otherEntries.push(...this.state.dataSource.sunRiseSet);
    if (this.state.dataSource.yesterday && this.state.dataSource.yesterday.length)
      otherEntries.push(...this.state.dataSource.yesterday);
    if (this.state.dataSource.almanac && this.state.dataSource.almanac.length)
      otherEntries.push(...this.state.dataSource.almanac);

    if (otherEntries.length) {
      pages.push(
        <View key="4" style={{ flex: 1 }}>
          {this.newFlatList(otherEntries)}
          <IndicatorBackgroundView />
        </View>);
    }

    return (
      <LocationSafeAreaView isCurrent={isCurrLocation}>
        {headerBar}
        <MySwiper {...{ pages, startPage }} />
      </LocationSafeAreaView>
    );
  }
};
CurrentLocation.contextType = SettingsContext;

function LocationSafeAreaView({ isCurrent, children }) {
  const insets = useSafeAreaInsets();

  return <View style={{ flex: 1, paddingBottom: isCurrent ? 0 : insets.bottom }}>
    {children}
  </View>;
}

function MySwiper({ startPage, pages }) {
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
  </Swiper>

}

function IndicatorBackgroundView() {
  return null;
  const { settings } = React.useContext(SettingsContext);
  return <View style={{
    height: 24, opacity: 50,
    backgroundColor: settings.dark ? Colors.darkListBackground : Colors.lightListBackground
  }} />;
}

function iconCodeToImage(iconCode, isDark) {
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

function ForecastItem(props) {
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
    titleText = <Text style={titleTextStyle}>{title}</Text>

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!isExpanded);
  }
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
      }} >
        {/* {index === 0 && <Divider />} */}
        {headingView}
        <View style={{ flex: 100, flexDirection: "row", paddingTop: 0, paddingBottom: 5, paddingRight: 5, alignItems: summary || warning ? "flex-start" : "center" }}>
          {imageView}
          <View style={{ flex: 1, flexDirection: "column", paddingLeft: 10, paddingTop: 5 }}>
            <View style={{ flexDirection: "row" }} >
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
};

function FavoriteIcon(props) {
  const { site } = props;
  const { favorites, updateFavorites } = React.useContext(FavoritesContext);
  const [snackVisible, setSnackVisible] = React.useState(false);
  const [snackMessage, setSnackMessage] = React.useState("");

  let findFavorite = () => favorites && favorites.find((entry) => entry.site === site.site);
  let isFavorite = () => findFavorite() !== undefined;
  let toggleFav = (showSnack) => {
    if (!favorites || favorites.length === 0) {
      return;
    }
    let isFav = isFavorite();
    let newFavorites;
    if (isFav) {
      newFavorites = favorites.filter((entry) => entry.site !== site.site);
    } else {
      newFavorites = [site].concat(favorites);
    }
    updateFavorites(newFavorites);

    if (showSnack) {
      let message = ' added to Favorites';
      if (isFav)
        message = ' removed from Favorites';
      setSnackMessage(site.nameEn + message);
      setSnackVisible(true);
    }
  };
  return (
    <View>
      <HeaderBarAction icon={isFavorite() ? "star" : "star-outline"} onPress={() => { toggleFav(true) }} />
      <Portal>
        <Snackbar
          visible={snackVisible}
          duration={1000}
          action={{ label: "Undo", onPress: () => toggleFav(false) }}
          onDismiss={() => setSnackVisible(false)}
        >{snackMessage}</Snackbar>
      </Portal>
    </View>
  );
}

function NightForecastsIcon(props) {
  const { settings, updateSetting } = React.useContext(SettingsContext);
  return <HeaderBarAction type="ionicon" name={settings.night ? "moon" : "moon-outline"}
    onPress={() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      updateSetting("night", !settings.night);
    }} />;
}

function MenuIcon({ navigation }) {
  const [visible, setVisible] = React.useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const theme = useTheme({ colors: { text: "white" } });
  return <Menu
    theme={theme}
    visible={visible}
    onDismiss={closeMenu}
    anchor={<HeaderBarAction type="material-community" name="dots-horizontal-circle-outline" onPress={openMenu} />}>
    <Menu.Item title="Settings" icon="cog"
      theme={theme}
      onPress={() => {
        navigation?.navigate("Settings");
        closeMenu();
      }
      } />
    <Menu.Item title="About" icon="information-outline"
      theme={theme}
      onPress={() => {
        navigation?.navigate("About");
        closeMenu();
      }
      } />
  </Menu>;

  return;
}

function AutoUpdateText(props) {
  const { dateTime, interval, style } = props;
  const [label, setLabel] = React.useState(getAsOfLabel(dateTime));
  const [visible, setVisible] = React.useState(true);

  const updateLabel = () => {
    setLabel(getAsOfLabel(dateTime));
  };

  // update the label once initially
  React.useEffect(() => {
    updateLabel();
  }, []);

  // update the label every interval as long as it's visible
  useInterval(() => {
    updateLabel();
  }, visible ? interval : null);

  // set visibiility from App state changes
  useAppStateChange((isActive) => {
    setVisible(isActive);
    if (isActive)
      updateLabel();
  });

  // set visibiility from navigation events
  useNavigationFocus((focused) => {
    setVisible(focused);
    if (focused)
      updateLabel();
  }, props.navigation);

  return <Text style={style}>{label}</Text>;
}

function useInterval(callback, delay) {
  const savedCallback = React.useRef();

  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function useAppStateChange(callback) {
  const savedCallback = React.useRef();

  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup the AppState handler
  React.useEffect(() => {
    function eventHandler(nextState) {
      savedCallback.current(nextState === 'active');
    }
    const subscription = AppState.addEventListener('change', eventHandler);
    return () => subscription.remove();
  }, []);
}

function useNavigationFocus(callback, navigation) {
  const savedCallback = React.useRef();

  // Remember the latest callback.
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup the handlers
  React.useEffect(() => {
    if (!navigation)
      return () => { };

    const focusUnsubscribe = navigation.addListener('focus', (payLoad) => {
      savedCallback.current(true, payLoad);
    });
    const blurUnsubscribe = navigation.addListener('blur', (payLoad) => {
      savedCallback.current(false, payLoad);
    });
    return () => {
      focusUnsubscribe();
      blurUnsubscribe();
    };
  }, [navigation]);
}

function HeadingText({ text }) {
  const { settings } = React.useContext(SettingsContext);
  return <Text style={{
    padding: 10, paddingTop: 5, paddingBottom: 5,
    backgroundColor: settings.dark ? '#444444' : '#eeeeee',
    // backgroundColor: 'orange',
    color: settings.dark ? 'white' : 'black',
    fontFamily: 'montserrat'
  }}>{text}</Text>
}
