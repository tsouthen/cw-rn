import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import iconv from 'iconv-lite';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Platform, Text, ToastAndroid, TouchableHighlight, View, AppState } from 'react-native';
import { ButtonGroup, Icon } from 'react-native-elements';
import { parseString } from 'react-native-xml2js';
import { FavoritesContext } from '../components/FavoritesContext';
import { HeaderButton, NavigationHeaderButton } from '../components/HeaderButton';
import { SettingsContext } from '../components/SettingsContext';
import { ShareContext } from '../components/ShareContext';
import Colors from '../constants/Colors';
import sitelocations from '../constants/sitelocations';
import CityListScreen from './CityListScreen';
const moment = require('moment');

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

export default function LocationScreen(props) {
  const { navigation, route } = props;
  const shareContext = React.useContext(ShareContext);
  const [lastFetch, setLastFetch] = React.useState();
  const [isLoading, setIsLoading] = React.useState(true);
  const [dataSource, setDataSource] = React.useState({ forecasts: [], nearestSites: [], hourlyData: [] })
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  React.useEffect(() => {
    let favIcon = null;
    let shareIcon = null;
    let site = route?.params?.currentSite;
    if (site) {
      favIcon = (<FavoriteIcon site={site} />);
      shareIcon = (<HeaderButton type='material' name='share' onPress={shareContext.onShare} />);
    }
    let settingsIcon = null;
    if (!route?.params?.site) {
      settingsIcon = (<NavigationHeaderButton type='material' name='settings' navigation={navigation} routeName='Settings' />);
    }
    navigation.setOptions({
      title: route?.params?.location ?? 'Location',
      headerRight: () =>
        <View style={{ flexDirection: 'row' }}>
          {favIcon}
          {shareIcon}
          {settingsIcon}
        </View>,
    });
  }, [navigation]);

  possiblyRefreshData = () => {
    const forecasts = dataSource.forecasts;
    // determine if a new xml file will be available: 
    //   now - lastFetch > 5 mins &&
    //   now - lastForecastDateTime > 65 mins 
    if (!isLoading && lastFetch && forecasts && forecasts.length > 0 && forecasts[0].dateTime) {
      const now = moment();
      let lastFetchMins = now.diff(lastFetch, 'minutes');
      let lastForecastMins = now.diff(forecasts[0].dateTime, 'minutes');

      if (lastFetchMins >= 5 && lastForecastMins >= 65) {
        console.log("refreshing old data");
        makeRemoteRequest();
      } else {
        console.log(`Not refreshing data, lastFetch:${lastFetchMins}, lastForecast:${lastForecastMins}`);
      }
    } else {
      console.log("No data to refresh");
      console.log(`  lastFetch:${data.lastFetch}`);
      console.log(`  num forecasts:${data.forecasts.length}`);
      if (data.forecasts.length > 0)
        console.log(`  last dateTime:${data.forecasts[0].dateTime}`);
    }
  }

  handleAppStateChange = nextAppState => {
    if (nextAppState === "active") {
      possiblyRefreshData();
    }
  }

  React.useEffect(() => {
    if (isLoading) {
      console.log("requesting remote data");
      makeRemoteRequest();
    }
    AppState.addEventListener('change', handleAppStateChange);

    willFocusSubscription = navigation.addListener('willFocus', (payLoad) => {
      possiblyRefreshData();
    });

    return () => {
      if (willFocusSubscription)
        willFocusSubscription.remove();

      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  makeRemoteRequest = async () => {
    try {
      let sortedLocs = [];
      let nearest = route?.params?.site;
      if (!nearest) {
        let location;
        // on emulator just generate a random location
        if (Platform.OS === 'android' && !Constants.isDevice) {
          nearest = sitelocations[randomIntInRange(0, sitelocations.length)];
          location = { coords: { latitude: nearest.latitude, longitude: nearest.longitude } };
        } else {
          await Location.requestPermissionsAsync();
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest, maximumAge: 15 * 60 * 1000, timeout: 30 * 1000 });
        }
        sortedLocs = orderByDistance(location.coords, sitelocations);
        sortedLocs = sortedLocs.slice(0, 10);
        nearest = sortedLocs[0]; //findNearest(location.coords, sitelocations);
      }

      let site = 's0000047'; //Calgary
      let prov = 'AB';
      // site = 's0000656'; //Comox
      // prov = 'BC';
      // nearest = undefined;
      if (nearest) {
        site = nearest.site;
        prov = nearest.prov;
      }

      let targetUrl = 'https://dd.weather.gc.ca/citypage_weather/xml/' + prov + '/' + site + '_e.xml';
      const xml = await fetchXML(targetUrl);
      const responseJson = await jsonFromXml(xml);
      let entries = loadJsonData(responseJson);
      let hourlyData = loadHourlyForecasts(responseJson);

      navigation.setParams({
        location: responseJson.location.name._,
        currentSite: nearest,
      });

      setLastFetch(moment());
      setIsLoading(false);
      setDataSource({
        forecasts: entries,
        nearestSites: sortedLocs,
        hourlyData: hourlyData,
      });
      setSelectedIndex(0);
    } catch (error) {
      console.error(error);
    }
  };

  handleRefresh = () => {
    if (isLoading)
      return;

    if (!route?.params?.site) {
      navigation.setParams({ location: 'Location', currentSite: undefined });
    }
    setIsLoading(true);
    // OK to do here or do I need a useEffect?
    makeRemoteRequest();
  };

  newFlatList = (data, key) => {
    const keyProps = {};
    if (key)
      keyProps.key = key;
    return (
      <FlatList
        {...keyProps}
        style={{ flex: 1 }}
        data={data}
        renderItem={({ item, index }) => <ForecastItem {...item}
          navigation={navigation}
          index={index}
          onPress={() => {
            //we need the expanded state outside the ForecastItem as the FlatList is a virtualized list and items can be re-used
            item.expanded = !item.expanded;
            setDataSource(dataSource);
          }} />}
        keyExtractor={item => item.title}
        refreshing={isLoading}
        onRefresh={handleRefresh}
      />
    );
  };

  getButtonIcon = (name, type, index) => {
    let color = Colors.tabIconDefault;
    if (selectedIndex === index)
      color = Colors.tabIconSelected;
    return (
      <Icon name={name} type={type} color={color} />
      // <Button type="outline" color={color} icon={{name: name, type: type, color: color}} />
    );
  };

  forecastIcon = () => {
    return getButtonIcon('calendar-week', 'material-community', 0);
  };

  hourlyIcon = () => {
    return getButtonIcon('access-time', 'material', 1);
  };

  nearbyIcon = () => {
    return getButtonIcon('near-me', 'material', 2);
  };

  if (isLoading) {
    // <Text>Loading...</Text>
    return (
      <View style={{ flex: 1, marginTop: 80 }}>
        <ActivityIndicator color={Colors.primaryDark} />
      </View>
    )
  }

  let flatList;
  switch (selectedIndex) {
    case 0:
      flatList = newFlatList(dataSource.forecasts);
      break;

    case 1:
      flatList = newFlatList(dataSource.hourlyData);
      break;

    case 2:
      flatList = (<CityListScreen
        cities={dataSource.nearestSites}
        navigation={navigation}
        refreshing={isLoading}
        onRefresh={handleRefresh}
      />);
      break;
  }

  let buttons = [{ element: forecastIcon }, { element: hourlyIcon }];
  if (dataSource.nearestSites && dataSource.nearestSites.length)
    buttons.push({ element: nearbyIcon });

  // containerStyle={{borderColor: 'black', borderWidth: 0, borderBottomWidth: 1}}
  // containerStyle={{borderWidth: 0}}

  return (
    <View style={{ flex: 1 }}>
      <ButtonGroup
        onPress={(newIndex) => setSelectedIndex(newIndex)}
        selectedIndex={selectedIndex}
        selectedButtonStyle={{ backgroundColor: 'white', borderColor: Colors.tabIconSelected, borderWidth: 0, borderBottomWidth: 2 }}
        containerBorderRadius={0}
        containerStyle={{ borderWidth: 0 }}
        innerBorderStyle={{ width: 0 }}
        buttons={buttons}
        underlayColor={Colors.primaryLight}
      />
      {flatList}
    </View>
  );
};

loadJsonData = (responseJson) => {
  //returns an array of objects with the following keys: icon, title, summary, temperature, expanded, isNight, warning, warningUrl
  let entries = [];

  try {
    //create a new forecast entry for the current conditions
    if (responseJson.currentConditions && responseJson.currentConditions.temperature && responseJson.currentConditions.temperature._) {
      let dateTime = undefined;
      if (responseJson.currentConditions.dateTime && responseJson.currentConditions.dateTime.length > 0) {
        dateTime = parseTimeStamp(responseJson.currentConditions.dateTime[0].timeStamp);
      }
      const entry = {
        icon: responseJson.currentConditions.iconCode._,
        title: getAsOfLabel(dateTime),
        summary: valueOrEmptyString(responseJson.currentConditions.condition),
        temperature: responseJson.currentConditions.temperature._,
        expanded: true,
        isNight: false,
        dateTime: dateTime,
      };

      if (responseJson.warnings.event && responseJson.warnings.event.description) {
        let warning = responseJson.warnings.event.description;
        warning = warning.split(' ').map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ').trim();
        entry.warning = valueOrEmptyString(warning);
        entry.warningUrl = valueOrEmptyString(responseJson.warnings.url);
        if (entry.warningUrl)
          entry.warningUrl += "#wb-cont"; // to scroll to the main heading in the page
      }
      // console.debug(entry);
      entries.push(entry);
    }

    let dateTime = undefined;
    if (responseJson.forecastGroup && responseJson.forecastGroup.dateTime && responseJson.forecastGroup.dateTime.length > 0) {
      dateTime = parseTimeStamp(responseJson.forecastGroup.dateTime[0].timeStamp);
    }

    if (responseJson.forecastGroup.forecast && responseJson.forecastGroup.forecast.length) {
      responseJson.forecastGroup.forecast.forEach((entry, index) => {
        //remove temperature summary from overall summary
        let textSummary = entry.textSummary;
        if (isString(entry.temperatures.textSummary))
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

function loadHourlyForecasts(responseJson) {
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
        isHourly: true,
        heading: heading,
      });
    });
  }
  return entries;
};

function isString(item) {
  return item !== null && item !== undefined && 'string' === typeof (item);
};

function valueOrEmptyString(item) {
  if (!isString(item))
    return '';
  return item;
};

function randomInRange(start, end) {
  return start + ((end - start) * Math.random());
};

function randomIntInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function fetchXML(url) {
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

function jsonFromXml(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, { explicitArray: false, mergeAttrs: true, explicitRoot: false }, (err, result) => {
      if (err)
        reject(err);
      else
        resolve(result);
    });
  });
};

function getDistanceSquared(a, b) {
  return Math.pow(b.longitude - a.longitude, 2) + Math.pow(b.latitude - a.latitude, 2);
};

function orderByDistance(point, coords) {
  return coords.sort((a, b) => getDistanceSquared(point, a) - getDistanceSquared(point, b));
};

function iconCodeToName(iconCode) {
  if (!isString(iconCode)) {
    // console.debug('Non-string icon code: ' + iconCode);
    // return require('../assets/images/clever_weather.png');
    return null;
  }

  switch (Number(iconCode)) {
    case 0: //sun
      return require('../assets/images/sun.png');
    case 1: //little clouds
      return require('../assets/images/sun_cloud.png');
    case 4: //increasing cloud
      return require('../assets/images/sun_cloud_increasing.png');
    case 5: //decreasing cloud
    case 20: //decreasing cloud
      return require('../assets/images/sun_cloud_decreasing.png');
    case 2: //big cloud with sun
    case 3: //sun behind big cloud
    case 22: //big cloud with sun
      return require('../assets/images/cloud_sun.png');
    case 6: //rain with sun behind cloud
      return require('../assets/images/cloud_drizzle_sun_alt.png');
    case 7: //rain and snow with sun behind cloud
    case 8: //snow with sun behind cloud
      return require('../assets/images/cloud_snow_sun_alt.png');
    case 9: //cloud rain lightning
      return require('../assets/images/cloud_lightning_sun.png');
    case 10: //cloud
      return require('../assets/images/cloud.png');
    case 11:
    case 28:
      return require('../assets/images/cloud_drizzle_alt.png');
    case 12:
      return require('../assets/images/cloud_drizzle.png');
    case 13:
      return require('../assets/images/cloud_rain.png');
    case 15:
    case 16:
    case 17:
    case 18:
      return require('../assets/images/cloud_snow_alt.png');
    case 19:
      return require('../assets/images/cloud_lightning.png');
    case 23:
    case 24:
    case 44:
      return require('../assets/images/cloud_fog.png');
    case 25:
    case 45:
      return require('../assets/images/cloud_wind.png');
    case 14: //freezing rain
    case 26: //ice
    case 27: //hail
      return require('../assets/images/cloud_hail.png');
    case 30:
      return require('../assets/images/moon.png');
    case 31:
    case 32:
    case 33:
      return require('../assets/images/cloud_moon.png');
    case 21:
    case 34:
      return require('../assets/images/cloud_moon_increasing.png');
    case 35:
      return require('../assets/images/cloud_moon_decreasing.png');
    case 36:
      return require('../assets/images/cloud_drizzle_moon_alt.png');
    case 37:
    case 38:
      return require('../assets/images/cloud_snow_moon_alt.png');
    case 39:
      return require('../assets/images/cloud_lightning_moon.png');
  }
  // console.debug('Unknown icon code: ' + iconCode);
  // return require('../assets/images/clever_weather.png');
  return null;
}

function getDateTimeString(dateTime) {
  let format = 'h:mm a';
  if (moment().dayOfYear() !== moment(dateTime).dayOfYear())
    format = 'MMM D, ' + format;
  return moment(dateTime).format(format);
}

function ForecastItem(props) {
  const { title, temperature, summary, icon, isNight, isHourly, warning, warningUrl, index, heading, expanded, onPress, dateTime } = props;
  const settings = useContext(SettingsContext);

  let allowNight = settings && settings.night;
  if (index > 1 && !allowNight && isNight && !isHourly)
    return null;

  let imageView;
  if (icon !== undefined)
    imageView = <Image style={{ width: 50, height: 50, resizeMode: "contain" }} source={iconCodeToName(icon)} />;
  else
    imageView = <View style={{ width: 50, height: 50 }} />;

  let warningView = null;
  if (warning && warningUrl)
    warningView = (
      <TouchableHighlight style={{ alignSelf: 'flex-start' }} underlayColor='#ffffff' onPress={() => Linking.openURL(warningUrl)}>
        <Text style={{ textDecorationLine: 'underline', fontSize: 13, color: Colors.primaryDark }}>{warning && expanded ? warning : ''}</Text>
      </TouchableHighlight>);

  let summmaryView = null;
  if (summary && expanded)
    summmaryView = (<Text style={{ fontSize: 13, flex: 1 }}>{summary}</Text>);

  let fontColor = isNight ? '#777777' : 'black';
  let fontWeight = isNight ? 'normal' : 'bold';
  let displayTemp = temperature;
  if (index === 0 && displayTemp.length && settings && settings.round) {
    let tempVal = Number(displayTemp);
    if (!isNaN(tempVal))
      displayTemp = '' + Math.round(tempVal);
  }
  let headingView = null;
  let headingText = heading;
  if (!heading && !isHourly) {
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
    headingView = (<Text style={{ padding: 10, paddingTop: 5, paddingBottom: 5, backgroundColor: '#eeeeee', fontFamily: 'montserrat' }}>{headingText}</Text>);

  let titleText = null;
  const titleTextStyle = { fontSize: 18, fontFamily: 'montserrat', flex: 1, color: fontColor };
  if (dateTime && index === 0)
    titleText = <AutoUpdateText style={titleTextStyle} dateTime={dateTime} interval={60000} navigation={props.navigation}>{title}</AutoUpdateText>;
  else
    titleText = <Text style={titleTextStyle}>{title}</Text>

  return (
    <TouchableHighlight underlayColor={Colors.primaryLight} onPress={onPress}>
      <View style={{ flex: 100, flexDirection: "column" }} >
        {headingView}
        <View style={{ flex: 100, flexDirection: "row", paddingTop: 0, paddingBottom: 5, paddingRight: 5 }}>
          {imageView}
          <View style={{ flex: 1, flexDirection: "column", paddingLeft: 10, paddingTop: 5 }}>
            <View style={{ flexDirection: "row" }} >
              {titleText}
              <Text style={{ fontSize: 18, fontWeight: fontWeight, color: fontColor }}>{displayTemp ? displayTemp + '°' : ''}</Text>
            </View>
            {summmaryView}
            {warningView}
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: '#eeeeee' }} />
      </View>
    </TouchableHighlight>);
};

function FavoriteIcon(props) {
  const { site } = props;
  const favorites = useContext(FavoritesContext);
  let findFavorite = () => favorites && favorites.favorites && favorites.favorites.find((entry) => entry.site === site.site);
  let isFavorite = () => findFavorite() !== undefined;
  let toggleFav = () => {
    if (!favorites || !favorites.favorites || favorites.favorites.length === 0) {
      return;
    }
    let isFav = isFavorite();
    let newFavorites;
    if (isFav) {
      newFavorites = favorites.favorites.filter((entry) => entry.site !== site.site);
    } else {
      newFavorites = [site].concat(favorites.favorites);
    }
    favorites.updateFavorites(newFavorites);
    if (Platform.OS === 'android') {
      let message = ' added to Favorites';
      if (isFav)
        message = ' removed from Favorites';
      ToastAndroid.show(site.nameEn + message, ToastAndroid.SHORT);
    }
  };
  return (<HeaderButton type='font-awesome' name={isFavorite() ? 'star' : 'star-o'} onPress={toggleFav} />);
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
  const [label, setLabel] = useState(getAsOfLabel(dateTime));
  const [visible, setVisible] = useState(true);

  updateLabel = () => {
    setLabel(getAsOfLabel(dateTime));
  };

  // update the label once initially
  useEffect(() => {
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
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
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
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup the AppState handler
  useEffect(() => {
    function eventHandler(nextState) {
      savedCallback.current(nextState === 'active');
    }
    AppState.addEventListener('change', eventHandler);
    return () => AppState.removeEventListener('change', eventHandler);
  }, []);
}

function useNavigationFocus(callback, navigation) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup the handlers
  useEffect(() => {
    if (!navigation)
      return () => { };

    focusListener = navigation.addListener('focus', (payLoad) => {
      savedCallback.current(true, payLoad);
    });
    blurListener = navigation.addListener('blur', (payLoad) => {
      savedCallback.current(false, payLoad);
    });
    return () => {
      focusListener.remove();
      blurListener.remove();
    };
  }, [navigation]);
}
