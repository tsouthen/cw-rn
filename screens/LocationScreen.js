import Constants from 'expo-constants';
import * as Location from 'expo-location';
import React from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, StyleSheet, Text, View, AppState } from 'react-native';
import { Menu, Portal, Snackbar, useTheme } from 'react-native-paper';
import { parseString } from 'react-native-xml2js';
import { FavoritesContext } from '../components/FavoritesContext';
import { SettingsContext } from '../components/SettingsContext';
import Colors from '../constants/Colors';
import sitelocations from '../constants/sitelocations';
import CityListScreen from './CityListScreen';
import HeaderBar, { HeaderBarAction, HeaderBarShareAction } from '../components/HeaderBar';
import { getAsOfLabel, loadWeatherOffice } from "../extractor";
import { LocationSafeAreaView } from './LocationSafeAreaView';
import { MySwiper } from './MySwiper';
import { IndicatorBackgroundView } from './IndicatorBackgroundView';
import { ForecastItem } from './ForecastItem';
import { NightForecastsIcon } from './NightForecastsIcon';

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

export function AutoUpdateText(props) {
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

export function HeadingText({ text }) {
  const { settings } = React.useContext(SettingsContext);
  return <Text style={{
    padding: 10, paddingTop: 5, paddingBottom: 5,
    backgroundColor: settings.dark ? '#444444' : '#eeeeee',
    // backgroundColor: 'orange',
    color: settings.dark ? 'white' : 'black',
    fontFamily: 'montserrat'
  }}>{text}</Text>
}
