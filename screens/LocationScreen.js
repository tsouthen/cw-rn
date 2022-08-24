import React from 'react';
import { Platform, FlatList, ActivityIndicator, StyleSheet, Text, View, Image, TouchableHighlight, Linking  } from 'react-native';
import sitelocations from '../constants/sitelocations';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { parseString } from 'react-native-xml2js';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import { Icon, ListItem } from 'react-native-elements';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
  title: {
    color: 'white',
    fontWeight: 'normal',
    fontSize: 18,
    fontFamily: 'montserrat',
    backgroundColor: '#FF8800',
    padding: 5
  },
});

//primary: #FF8800
//dark: #c55900
//light: #ffb944

export default class CurrentLocation extends React.Component {

  static navigationOptions = ({ navigation }) => {
    //console.debug(navigation);
    // <Icon type='material' name='star-border' color='#ffffff' underlayColor='#FF8800' size={24} iconStyle={{marginRight: 5}} onPress={navigation.getParam('toggleFavoriteAction')} />
    let isHourly = navigation.getParam('isHourly', false);
    let hasHourly = navigation.getParam('hourlyData') !== undefined;
    let nearMeIcon = null;
    let settingsIcon = null;
    let hourlyIcon = null;

    if (!isHourly && navigation.getParam('site') === undefined) {
      nearMeIcon = (<Icon type='material' name='near-me' color='#ffffff' underlayColor='#FF8800' size={24} iconStyle={{marginRight: 10}} onPress={navigation.getParam('nearMeAction')} />);
      settingsIcon = (<Icon type='material' name='settings' color='#ffffff' underlayColor='#FF8800' size={24} iconStyle={{marginRight: 10}} onPress={navigation.getParam('settingsAction')} />);
    }
    if (!isHourly && hasHourly)
      hourlyIcon = (<Icon type='material' name='access-time' color='#ffffff' underlayColor='#FF8800' size={24} iconStyle={{marginRight: 10}} onPress={navigation.getParam('hourlyAction')} />);
    return {
      title: navigation.getParam('location', 'Location'),
      headerRight: (
        <View style={{flexDirection:'row'}}>
          {hourlyIcon}
          {nearMeIcon}
          {settingsIcon}
        </View>),
    };
  };

  constructor(props) {
    super(props);
    this.state = { 
      isLoading: true,
      dataSource: [],
      }
  };

  componentDidMount() {
    this.makeRemoteRequest();
    this.props.navigation.setParams({
      nearMeAction : this.handleNearMe, 
      toggleFavoriteAction: this.toggleFavorite,
      settingsAction: this.handleSettings,
      hourlyAction: this.handleHourly,
    });
  };

  handleNearMe = () => {
    this.props.navigation.navigate('CityList', { 
      title: 'Nearby',
      cities: this.state.nearestSites,
    });
  };

  handleSettings = () => {
    this.props.navigation.navigate('Settings', { 
      title: 'Settings',
    });
  };

  handleHourly = () => {
    let hourlyData = this.props.navigation.getParam('hourlyData');
    if (hourlyData) {
      let location = this.props.navigation.getParam('location');
      if (location)
        location = location + ' (Hourly)';
      this.props.navigation.push('City', { 
        location: location || 'Hourly',
        hourlyData: hourlyData,
        isHourly: true,
      });
    }
  };

  toggleFavorite = () => {
    alert('Favorite pressed');
  };

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

  orderByDistance = function(point, coords) {
    return coords.sort((a, b) => this.getDistanceSquared(point, a) - this.getDistanceSquared(point, b));
  };

  getDistanceSquared = function(a, b) {
    return Math.pow(b.longitude - a.longitude, 2) + Math.pow(b.latitude - a.latitude, 2);
  };

  makeRemoteRequest = async () => {
    try {
      let sortedLocs = [];
      let entries = [];

      const { navigation } = this.props;
      if (navigation.getParam('isHourly', false))
        entries = navigation.getParam('hourlyData', []);

      if (!entries || entries.length == 0) {
        let nearest = navigation.getParam('site', undefined);
        if (!nearest) {
          let location;
          if (Platform.OS === 'android' && !Constants.isDevice) {
            nearest = sitelocations[this.randomIntInRange(0, sitelocations.length)];
            location = { coords: { latitude: nearest.latitude, longitude: nearest.longitude }};
          } else {
            // this.props.navigation.setParams({ location: 'requesting permission...'});
            await Location.requestPermissionsAsync();
            // this.props.navigation.setParams({ location: 'getting location...'});
            location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest, maximumAge: 900000 }); 
          }
          sortedLocs = this.orderByDistance(location.coords, sitelocations);
          sortedLocs = sortedLocs.slice(0, 10);
          //console.debug(sortedLocs);
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
        // this.props.navigation.setParams({ location: 'downloading...'});
        let targetUrl = 'https://dd.weather.gc.ca/citypage_weather/xml/' + prov + '/' + site + '_e.xml';
        console.debug('targetUrl: ' + targetUrl);
        const xml = await this.fetchXML(targetUrl);
        // this.props.navigation.setParams({ location: 'parsing...'});
        const responseJson = await this.jsonFromXml(xml);
        //console.debug(JSON.stringify(responseJson));
        entries = this.loadJsonData(responseJson);
        let hourlyData = this.loadHourlyForecasts(responseJson);
        this.props.navigation.setParams({ 
          location: responseJson.location.name._,
          hourlyData: hourlyData,
        });
      }

      this.setState({
        isLoading: false,
        dataSource: entries,
        nearestSites: sortedLocs,
      });
    } catch (error) {
      console.error(error);
    }
  };

  loadJsonData = (responseJson) => {
    //returns an array of objects with the following keys: icon, title, summary, temperature, expanded, isNight, warning, warningUrl
    let entries = [];

    try {
      //create a new forecast entry for the current conditions
      if (responseJson.currentConditions && responseJson.currentConditions.temperature && responseJson.currentConditions.temperature._) {
        const entry = {
          icon: responseJson.currentConditions.iconCode._,
          title: 'Now',
          summary: CurrentLocation.valueOrEmptyString(responseJson.currentConditions.condition),
          temperature: responseJson.currentConditions.temperature._,
          expanded: true,
          isNight: false,
        };

        if (responseJson.warnings.event && responseJson.warnings.event.description) {
          let warning = responseJson.warnings.event.description;
          warning = warning.split(' ').map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ').trim();
          entry.warning = CurrentLocation.valueOrEmptyString(warning);
          entry.warningUrl = CurrentLocation.valueOrEmptyString(responseJson.warnings.url);
        }
        // console.debug(entry);
        entries.push(entry);
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
          });
        });
      }
    } catch (error) {
      console.error(error);
    }

    return entries;
  };

  parseTimeStamp = (timeStamp) => {
    //              YYYY                          MM                            DD                            HH                            MM
    let formatted = timeStamp.slice(0, 4) + '-' + timeStamp.slice(4, 2) + '-' + timeStamp.slice(6, 2) + 'T' + timeStamp.slice(8, 2) + ':' + timeStamp.slice(10, 2) + ':00.000Z';
    return new Date(formatted);
  };

  loadHourlyForecasts = (responseJson) => {
    let entries = [];

    if (responseJson.hourlyForecastGroup.hourlyForecast && responseJson.hourlyForecastGroup.hourlyForecast.length) {
      // let utcTimeStamp = responseJson.hourlyForecastGroup.dateTime[0].timeStamp;
      // let localHour = parseInt(responseJson.hourlyForecastGroup.dateTime[1].hour);
      let utcOffset = Number(responseJson.hourlyForecastGroup.dateTime[1].UTCOffset);
      let minSuffix;
      if (!Number.isInteger(utcOffset)) {
        console.debug('utcOffset non integer: ' + utcOffset);
        let mins = Math.round((utcOffset - Math.floor(utcOffset)) * 60);
        utcOffset = Math.floor(utcOffset);
        minSuffix = '';
        if (mins < 10)
          minSuffix = '0';
        minSuffix += '' + mins;
        console.debug('minSuffix: ' + minSuffix);
      } else {
        minSuffix = '00';
      }
      let sunrise = 6;
      let sunset = 18;

      if (responseJson.riseSet && responseJson.riseSet.dateTime && responseJson.riseSet.dateTime.length) {
        responseJson.riseSet.dateTime.forEach((entry, index) => {
          if (entry.name === 'sunrise' && entry.zone !== 'UTC') {
            sunrise = parseInt(entry.hour);
            console.debug('sunrise: ' + sunrise);
          } else if (entry.name === 'sunset' && entry.zone !== 'UTC') {
            sunset = parseInt(entry.hour);
            console.debug('sunset: ' + sunset);
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

        entries.push({
          icon: entry.iconCode && entry.iconCode._,
          title: '' + displayHour + suffix,
          summary: entry.condition,
          temperature: entry.temperature && entry.temperature._,
          expanded: entries.length === 0 || entry.condition !== entries[entries.length-1].summary,
          isNight: currHour > sunset || currHour < sunrise,
          isHourly: true,
        });
      });
    }
    return entries;
  };

  static isString = (item) => {
    return item !== null && item !== undefined && 'string' === typeof(item);
  };

  static valueOrEmptyString = (item) => {
    if (!CurrentLocation.isString(item))
      return '';
    return item;
  };

  handleRefresh = () => {
    if (this.state.isLoading)
      return;
    
    const { navigation } = this.props;
    // if (navigation.getParam('site') === undefined)
    //   this.props.navigation.setParams({ location: 'Loading...'});
    this.setState({ isLoading: true }, () => { this.makeRemoteRequest(); });   
  };

  handlePress = (item, index) => {
    //alert('Row pressed:' + index);
    var dataSource = this.state.dataSource;
    dataSource[index].expanded = !dataSource[index].expanded;
    this.setState({ dataSource: dataSource});
  };

  handleUrl = (item, index) => {
    // alert('clicked url');
    if (item.warningUrl)
      Linking.openURL(item.warningUrl);
  };

  render() {
    if (this.state.isLoading) {
      // <Text>Loading...</Text>

      return (
        <View style={{flex: 1, marginTop: 40 }}>
          <ActivityIndicator color='#c55900' />
        </View>
      )
    }

    return(
      <FlatList style={{flex: 1}}
        data={ this.state.dataSource }
        renderItem={({item, index}) => {
          let allowNight = global.settings && global.settings.night;
          if (index > 1 && !allowNight && item.isNight && !item.isHourly)
            return null;

          let imageView;
          if (item.icon !== undefined)
            imageView = <Image style={{width: 50, height: 50, resizeMode: "contain"}} source={ this.iconCodeToName(item.icon) } />;
          else
            imageView = <View style={{width: 50, height: 50}}/>;

          let warningView = null;
          if (item.warning && item.warningUrl)
            warningView = (
              <TouchableHighlight style={{alignSelf:'flex-start'}} underlayColor='#ffffff' onPress={() => this.handleUrl(item, index)}>
                <Text style={{textDecorationLine:'underline', fontSize:13, color:'#c55900'}}>{item.warning && item.expanded ? item.warning : ''}</Text>
              </TouchableHighlight>);

          let summmaryView = null;
          if (item.summary && item.expanded)
              summmaryView = (<Text style={{fontSize:13, flex:1}}>{item.summary}</Text>);

          let fontColor = item.isNight ? '#777777' : 'black';
          let fontWeight = item.isNight ? 'normal' : 'bold';
          let temperature = item.temperature;
          if (temperature && global.settings && global.settings.round) {
            let tempVal = Number(temperature);
            if (!isNaN(tempVal))
              temperature = Math.round(tempVal);
          }
          // let listProps = {
          //   title: item.title,
          //   titleStyle: {fontFamily: 'montserrat', color: fontColor, fontSize: 18},
          //   onPress: () => this.handlePress(item, index),
          //   bottomDivider: true,
          // };
          // if (temperature) {
          //   listProps = {
          //     ...listProps,
          //     rightTitle: temperature + '°',
          //     rightTitleStyle: {fontSize: 18, fontWeight: fontWeight, color: fontColor},
          //   };
          // }
          // if (item.summary && item.expanded) {
          //   listProps = {
          //     ...listProps,
          //     subtitle: item.summary,
          //   };
          // }
          // if (item.icon !== undefined) {
          //   listProps = {
          //     ...listProps,
          //     leftIcon: imageView,
          //   };
          // }
          //TODO: handle warningView
          // return (<ListItem {...listProps} />);

          return (
            <TouchableHighlight underlayColor='#ffb944' onPress={() => this.handlePress(item, index)}>
              <View style={{flex:100, flexDirection: "column"}} >
                <View style={{flex:100, flexDirection: "row", paddingTop: 0, paddingBottom: 5, paddingRight: 5}}>
                  {imageView}
                  <View style={{flex:1, flexDirection: "column", paddingLeft: 10, paddingTop: 5}}>
                    <View style={{flexDirection: "row"}} >
                      <Text style={{fontSize: 18, fontFamily: 'montserrat', flex:1, color: fontColor}}>{item.title}</Text>
                      <Text style={{fontSize: 18, fontWeight: fontWeight, color: fontColor}}>{temperature ? temperature + '°' : ''}</Text>
                    </View>
                    {summmaryView}
                    {warningView}
                  </View>
                </View>
                <View style={{ height:1, backgroundColor: '#eeeeee' }} />
              </View>
            </TouchableHighlight>);
          }}
        keyExtractor={item => item.title}
        refreshing={this.state.isLoading}
        onRefresh={this.handleRefresh}
      />
    );
  }

  iconCodeToName = (iconCode) => {
    if (!CurrentLocation.isString(iconCode)) {
      console.debug('Non-string icon code: ' + iconCode);
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
    console.debug('Unknown icon code: ' + iconCode);
    // return require('../assets/images/clever_weather.png');
    return null;
  }
};
