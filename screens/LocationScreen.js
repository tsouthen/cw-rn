import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import iconv from 'iconv-lite';
import React from 'react';
import { ActivityIndicator, FlatList, Image, LayoutAnimation, Linking, Platform, StyleSheet, Text, TouchableHighlight, View, AppState } from 'react-native';
import { Menu, Portal, Snackbar, useTheme } from 'react-native-paper';
import { parseString } from 'react-native-xml2js';
import Swiper from 'react-native-swiper';
import { FavoritesContext } from '../components/FavoritesContext';
import { SettingsContext } from '../components/SettingsContext';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import sitelocations from '../constants/sitelocations';
import CityListScreen from './CityListScreen';
const moment = require('moment');
import HeaderBar, { HeaderBarAction, HeaderBarShareAction } from '../components/HeaderBar';
import { Icon } from '../components/Icon';

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
      const now = moment();
      let lastFetchMins = now.diff(lastFetch, 'minutes');
      let lastForecastMins = now.diff(forecasts[0].dateTime, 'minutes');

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

  fetchXML = (url) => {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.onload = () => {
        if (request.status === 200) {
          resolve(iconv.decode(Buffer.from(request.response), 'iso-8859-1'));
        } else {
          reject(new Error(request.statusText));
        }
      };
      let errorFunc = () => reject(new Error(request.statusText));
      request.onerror = errorFunc;
      request.onabort = errorFunc;
      request.ontimeout = errorFunc;

      request.responseType = 'arraybuffer';

      request.open('GET', url);
      request.setRequestHeader('Content-type', 'text/xml; charset=ISO-8859-1');
      request.send();
    });
  };

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
      let entries = this.loadJsonData(responseJson);
      let hourlyData = this.loadHourlyForecasts(responseJson);
      let yesterday = this.loadYesterday(responseJson);
      let almanac = this.loadAlmanac(responseJson);
      let sunRiseSet = this.loadSunRiseSet(responseJson);

      navigation.setParams({
        location: responseJson.location.name._,
        currentSite: nearest,
      });

      this.setState({
        lastFetch: moment(),
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

  upperCaseFirstLetters = (text) => {
    return text.split(' ').map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ').trim();
  }

  separateWords = (text) => {
    let newText = text.replace(/([A-Z])/g, ' $1').trim()
    return newText.charAt(0).toUpperCase() + newText.slice(1);
  }

  loadJsonData = (responseJson) => {
    //returns an array of objects with the following keys: icon, title, summary, temperature, expanded, isNight, warning, warningUrl
    let entries = [];

    try {
      //create a new forecast entry for the current conditions
      if (responseJson.currentConditions && responseJson.currentConditions.temperature && responseJson.currentConditions.temperature._) {
        let dateTime = undefined;
        if (responseJson.currentConditions.dateTime && responseJson.currentConditions.dateTime.length > 0) {
          dateTime = this.parseTimeStamp(responseJson.currentConditions.dateTime[0].timeStamp);
        }
        const entry = {
          icon: responseJson.currentConditions.iconCode._,
          title: getAsOfLabel(dateTime),
          summary: CurrentLocation.valueOrEmptyString(responseJson.currentConditions.condition),
          temperature: responseJson.currentConditions.temperature._,
          expanded: true,
          isNight: false,
          dateTime: dateTime,
        };

        if (responseJson.warnings.event && responseJson.warnings.event.description) {
          let warning = responseJson.warnings.event.description;
          warning = this.upperCaseFirstLetters(warning);
          entry.warning = CurrentLocation.valueOrEmptyString(warning);
          entry.warningUrl = CurrentLocation.valueOrEmptyString(responseJson.warnings.url);
        }
        // console.debug(entry);
        entries.push(entry);
      }

      let dateTime = undefined;
      if (responseJson.forecastGroup && responseJson.forecastGroup.dateTime && responseJson.forecastGroup.dateTime.length > 0) {
        dateTime = this.parseTimeStamp(responseJson.forecastGroup.dateTime[0].timeStamp);
      }

      if (responseJson.forecastGroup.forecast && responseJson.forecastGroup.forecast.length) {
        responseJson.forecastGroup.forecast.forEach((entry, index) => {
          //remove temperature summary from overall summary
          let textSummary = entry.textSummary;
          if (CurrentLocation.isString(entry.temperatures.textSummary))
            textSummary = entry.textSummary.replace(entry.temperatures.textSummary, '');

          let iconCode = undefined;
          if (entry.abbreviatedForecast && entry.abbreviatedForecast.iconCode && entry.abbreviatedForecast.iconCode._)
            iconCode = entry.abbreviatedForecast.iconCode._;
          else if (entry.iconCode && entry.iconCode._)
            iconCode = entry.iconCode._;

          let temperature = '';
          if (entry.temperatures && entry.temperatures.temperature && entry.temperatures.temperature._)
            temperature = entry.temperatures.temperature._;

          entries.push({
            icon: iconCode,
            title: entry.period.textForecastName,
            summary: textSummary,
            temperature: temperature,
            expanded: entries.length == 0,
            isNight: entry.temperatures.temperature !== undefined && entry.temperatures.temperature.class === "low",
            dateTime: dateTime,
          });
          dateTime = undefined;
        });
      }
    } catch (error) {
      console.error(error);
    }

    return entries;
  };

  parseTimeStamp = (timeStamp) => {
    //              YYYY                          MM                            DD                            HH                            MM
    let formatted = timeStamp.slice(0, 4) + '-' + timeStamp.slice(4, 6) + '-' + timeStamp.slice(6, 8) + 'T' + timeStamp.slice(8, 10) + ':' + timeStamp.slice(10, 12) + ':00.000Z';
    return new Date(formatted);
  };

  loadHourlyForecasts = (responseJson) => {
    let entries = [];

    if (responseJson.hourlyForecastGroup && responseJson.hourlyForecastGroup.hourlyForecast && responseJson.hourlyForecastGroup.hourlyForecast.length) {
      // let utcTimeStamp = responseJson.hourlyForecastGroup.dateTime[0].timeStamp;
      // let localHour = parseInt(responseJson.hourlyForecastGroup.dateTime[1].hour);
      let utcOffset = Number(responseJson.hourlyForecastGroup.dateTime[1].UTCOffset);
      let minSuffix;
      if (!Number.isInteger(utcOffset)) {
        // console.debug('utcOffset non integer: ' + utcOffset);
        let mins = Math.round((utcOffset - Math.floor(utcOffset)) * 60);
        utcOffset = Math.floor(utcOffset);
        minSuffix = '';
        if (mins < 10)
          minSuffix = '0';
        minSuffix += '' + mins;
        // console.debug('minSuffix: ' + minSuffix);
      } else {
        minSuffix = '00';
      }
      let sunrise = 6;
      let sunset = 18;

      if (responseJson.riseSet && responseJson.riseSet.dateTime && responseJson.riseSet.dateTime.length) {
        responseJson.riseSet.dateTime.forEach((entry, index) => {
          if (entry.name === 'sunrise' && entry.zone !== 'UTC') {
            sunrise = parseInt(entry.hour);
            // console.debug('sunrise: ' + sunrise);
          } else if (entry.name === 'sunset' && entry.zone !== 'UTC') {
            sunset = parseInt(entry.hour);
            // console.debug('sunset: ' + sunset);
          }
        });
      }
      responseJson.hourlyForecastGroup.hourlyForecast.forEach((entry, index) => {
        let currHour = parseInt(entry.dateTimeUTC.substr(8, 2));
        currHour += utcOffset;
        if (currHour < 0)
          currHour += 24;
        if (currHour >= 24)
          currHour -= 24;
        let displayHour = currHour;
        let suffix = ':' + minSuffix + ' am';
        if (displayHour >= 12)
          suffix = ':' + minSuffix + ' pm';
        if (displayHour > 12)
          displayHour -= 12;
        if (displayHour == 0)
          displayHour = 12;

        let heading = null;
        if (index === 0)
          heading = 'Today';
        else if (currHour === 0)
          heading = 'Tomorrow';

        entries.push({
          icon: entry.iconCode && entry.iconCode._,
          title: '' + displayHour + suffix,
          summary: entry.condition,
          temperature: entry.temperature && entry.temperature._,
          expanded: entries.length === 0 || entry.condition !== entries[entries.length - 1].summary,
          isNight: currHour > sunset || currHour < sunrise,
          isOther: true,
          heading: heading,
        });
      });
    }
    return entries;
  };

  loadYesterday = (responseJson) => {
    let entries = [];
    let heading = "Yesterday";
    const yesterday = responseJson.yesterdayConditions;
    if (yesterday) {
      if (yesterday.temperature && yesterday.temperature.length) {
        yesterday.temperature.forEach((entry, index) => {
          const isNight = entry.class.endsWith("low");
          entries.push({
            category: "Yesterday",
            heading: heading,
            title: this.separateWords(entry.class),
            temperature: entry._,
            isNight: isNight,
            isOther: true,
            icon: { type: "feather", name: isNight ? "arrow-down-circle" : "arrow-up-circle" },
          });
          heading = null;
        });
      }
      if (yesterday.precip && yesterday.precip._ && yesterday.precip._ != "0.0") {
        let precipVal = yesterday.precip._;
        if (!isNaN(Number(precipVal)))
          precipVal += ` ${yesterday.precip.units}`;
        entries.push({
          category: "Yesterday",
          title: "Precipitation",
          value: precipVal,
          isOther: true,
          icon: { type: "feather", name: "umbrella" },
        });
        heading = null;
      }
    }
    return entries;
  }

  loadAlmanac = (responseJson) => {
    let normals = [];
    let extremes = [];
    let normalsHeading = "Normals for today";
    let extremesHeading = "Extremes for today";

    let addEntry = (newEntry) => {
      if (newEntry.title.startsWith("Normal ")) {
        newEntry.heading = normalsHeading;
        newEntry.title = newEntry.title.substr(7);
        let isMean = false;
        if (newEntry.title == "Mean") {
          newEntry.title = "Average";
          newEntry.fontWeight = 'normal';
          isMean = true;
        }
        // put mean before min if we already have a normals entry
        if (isMean && normals.length == 2) {
          normals.splice(1, 0, newEntry);
        } else {
          normals.push(newEntry);
        }
        normalsHeading = null;
      } else if (newEntry.title.startsWith("Extreme ")) {
        newEntry.heading = extremesHeading;
        newEntry.title = newEntry.title.substr(8);
        // skip duplicate entries where all that differs is the title (extremeRainfall and extremePrecipitation)
        if (!newEntry.value || !extremes.find((entry) => entry.summary === newEntry.summary && entry.value === newEntry.value)) {
          extremes.push(newEntry);
          extremesHeading = null;
        }
      } else {
        newEntry.heading = normalsHeading;
        normals.push(newEntry);
        normalsHeading = null;
      }
    };

    const almanac = responseJson.almanac;
    if (almanac && almanac.temperature && almanac.temperature.length) {
      almanac.temperature.forEach((entry, index) => {
        if (entry._) {
          let icon = "thermometer_mean";
          if (entry.class.endsWith("Max"))
            icon = icon = "thermometer_max";
          else if (entry.class.endsWith("Min"))
            icon = "thermometer_min";
          addEntry({
            category: "Almanac",
            key: entry.class,
            title: this.separateWords(entry.class),
            temperature: entry._,
            isNight: entry.class.endsWith("Min"),
            isOther: true,
            summary: entry.year,
            expanded: !!entry.year,
            icon: icon,
          });
        }
      });
    }
    if (almanac && almanac.precipitation && almanac.precipitation.length) {
      almanac.precipitation.forEach((entry, index) => {
        if (entry._ && entry._ !== "0.0") {
          let iconName = "umbrella";
          if (entry.class.toLowerCase().includes("rain"))
            iconName = "cloud-rain";
          else if (entry.class.toLowerCase().includes("snow"))
            iconName = "cloud-snow";
          addEntry({
            category: "Almanac",
            key: entry.class,
            title: this.separateWords(entry.class),
            value: `${entry._} ${entry.units}`,
            isOther: true,
            summary: entry.year,
            expanded: !!entry.year,
            icon: { type: "feather", name: iconName },
          });
        }
      });
    }
    return [...normals, ...extremes];
  }

  getSunRiseSetTitle = (name) => {
    switch (name) {
      case "sunrise": return "Rise";
      case "sunset": return "Set";
    }
    return this.separateWords(name);
  }

  loadSunRiseSet = (responseJson) => {
    let entries = [];
    let heading = "Sun rise & set";
    const riseSet = responseJson.riseSet;
    if (riseSet && riseSet.dateTime && riseSet.dateTime.length) {
      riseSet.dateTime.forEach((entry, index) => {
        if (entry.zone !== "UTC") {
          let hour = Number(entry.hour);
          let suffix = "am";
          if (hour >= 12) {
            if (hour > 12)
              hour -= 12;
            suffix = "pm";
          }
          const title = this.getSunRiseSetTitle(entry.name);
          const isSunrise = title === "Rise";
          entries.push({
            heading: heading,
            category: "RiseSet",
            title: title,
            value: `${hour}:${entry.minute} ${suffix}`,
            isOther: true,
            isNight: false,
            icon: isSunrise ? "sunrise" : "sunset",
          });
          heading = null;
        }
      });
    }
    return entries;
  }

  static isString = (item) => {
    return item !== null && item !== undefined && 'string' === typeof (item);
  };

  static valueOrEmptyString = (item) => {
    if (!CurrentLocation.isString(item))
      return '';
    return item;
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
    const hasLocation = !isCurrLocation || route?.params?.currentSite;
    const site = route?.params?.site || route?.params?.currentSite;
    // const subtitle = route?.params?.location ? this.state.subtitle : null;

    const headerBar = (
      <HeaderBar navigation={navigation} title={route?.params?.location ?? 'Location'} showBackButton={!isCurrLocation} /* subtitle={subtitle} */ >
        {site && <FavoriteIcon site={site} />}
        {site && <NightForecastsIcon />}
        {site && <MenuIcon navigation={navigation} />}
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
      <View style={{ flex: 1 }}>
        {headerBar}
        <MySwiper {...{ pages, startPage }} />
      </View>
    );
  }
};
CurrentLocation.contextType = SettingsContext;

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

function getDateTimeString(dateTime) {
  let format = 'h:mm a';
  if (moment().dayOfYear() !== moment(dateTime).dayOfYear())
    format = 'MMM D, ' + format;
  return moment(dateTime).format(format);
}

function ForecastItem(props) {
  const { title, temperature, summary, icon, isNight, isOther, warning, warningUrl, index, heading, expanded, dateTime, value } = props;
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
            {warningView}
          </View>
        </View>
        {/* <Divider /> */}
        {/* <View style={{ height: 1, backgroundColor: settings.dark ? '#777777' : '#eeeeee' }} /> */}
      </View>
    </TouchableHighlight>);
};

function Divider() {
  const { settings } = React.useContext(SettingsContext);
  return <View
    style={{
      height: StyleSheet.hairlineWidth,
      backgroundColor: settings.dark ? "white" : "rgba(0, 0, 0, 0.12)"
    }}
  />;
  // "rgba(255, 255, 255, 0.12)"
}

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

function SettingsIcon({ navigation }) {
  return <HeaderBarAction type="feather" name="settings" onPress={() => navigation?.navigate("Settings")} />;
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

function getAsOfLabel(dateTime) {
  if (!dateTime)
    return 'Now';

  // const minutes = Math.ceil(moment().diff(dateTime, 'minutes') / 15) * 15;
  let minutes = moment().diff(dateTime, 'minutes');
  if (minutes > 60) {
    minutes = Math.round(minutes / 15) * 15;
    const hours = Math.round(minutes / 60 * 100) / 100;
    if (hours === 1)
      titleText = `An hour ago`;
    else
      titleText = `${hours} hours ago`;
  } else if (minutes === 60)
    titleText = "An hour ago";
  else if (minutes === 30)
    titleText = "Half an hour ago";
  else
    titleText = `${minutes} minutes ago`;
  return titleText;
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
