import React from 'react';
import { Platform, FlatList, ActivityIndicator, StyleSheet, Text, View, Image, TouchableHighlight, Linking  } from 'react-native';
import { findNearest, orderByDistance } from 'geolib';
import sitelocations from '../constants/sitelocations';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { parseString } from 'react-native-xml2js';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';
import { MaterialIcons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
  title: {
    color: 'white',
    fontWeight: 'normal',
    fontSize: 20,
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
    return {
      title: navigation.getParam('location', 'Location'),
      //headerRight: (<MaterialIcons name='search' color='#fff' size={24} style={{marginRight: 5}} />),
    };
  };

  constructor(props) {
    super(props);
    this.state = { 
      isLoading: true,
      dataSource: [],
      }
  }

  componentDidMount() {
    this.makeRemoteRequest();
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

  makeRemoteRequest = async () => {
    try {
      const { navigation } = this.props;
      let nearest = navigation.getParam('site', undefined);
      if (!nearest) {
        if (Platform.OS === 'android' && !Constants.isDevice) {
          nearest = sitelocations[this.randomIntInRange(0, sitelocations.length)];
        } else {
          this.props.navigation.setParams({ location: 'requesting permission...'});
          await Location.requestPermissionsAsync();
          this.props.navigation.setParams({ location: 'getting location...'});
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest, maximumAge: 900000 }); 
          nearest = findNearest(location.coords, sitelocations);
        }
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
      this.props.navigation.setParams({ location: 'downloading...'});
      let targetUrl = 'https://dd.weather.gc.ca/citypage_weather/xml/' + prov + '/' + site + '_e.xml';
      console.debug('targetUrl: ' + targetUrl);
      const xml = await this.fetchXML(targetUrl);
      this.props.navigation.setParams({ location: 'parsing...'});
      const responseJson = await this.jsonFromXml(xml);
      //console.debug(JSON.stringify(responseJson));
      const entries = this.loadJsonData(responseJson);
      this.setState({
        isLoading: false,
        dataSource: entries
      }, function () {
      });

      this.props.navigation.setParams({ location: responseJson.location.name._});
    } catch (error) {
      console.error(error);
    }
  };

  loadJsonData = (responseJson) => {
    //returns an array of objects with the following keys: icon, title, summary, temperature, expanded
    let entries = [];

    try {
      //create a new forecast entry for the current conditions
      if (responseJson.currentConditions && responseJson.currentConditions.temperature && responseJson.currentConditions.temperature._) {
        const entry = {
          icon: responseJson.currentConditions.iconCode._,
          title: 'Now', //responseJson.location.name._,
          summary: CurrentLocation.valueOrEmptyString(responseJson.currentConditions.condition),
          temperature: responseJson.currentConditions.temperature._,
          expanded: true,
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
          //skip the night forecasts, except for tonight
          if (index === 0 || entry.temperatures.temperature.class === "high") {
            //remove temperature summary from overall summary
            let textSummary = entry.textSummary;
            if (CurrentLocation.isString(entry.temperatures.textSummary))
              textSummary = entry.textSummary.replace(entry.temperatures.textSummary, '');
            
            entries.push({
              icon: entry.abbreviatedForecast.iconCode._,
              title: entry.period.textForecastName,
              summary: textSummary,
              temperature: entry.temperatures.temperature._,
              expanded: false,
            });
          }
        });
      }
    } catch (error) {
      console.error(error);
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
    if (navigation.getParam('site') === undefined)
      this.props.navigation.setParams({ location: 'Loading...'});
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
      <View style={{flex: 1}}>
        <FlatList
          data={ this.state.dataSource }
          renderItem={({item, index}) => {
            let imageView;
            if (item.icon !== undefined)
              imageView = <Image style={{width: 50, height: 50, resizeMode: "contain"}} source={ this.iconCodeToName(item.icon) } />;
            else
              imageView = <View style={{width: 50, height: 50}}/>;

            let warningView;
            if (item.warning && item.warningUrl)
              warningView = (
                <TouchableHighlight style={{alignSelf:'flex-start'}} underlayColor='#ffffff' onPress={() => this.handleUrl(item, index)}>
                  <Text style={{textDecorationLine:'underline', fontSize:13, color:'#c55900'}}>{item.warning && item.expanded ? item.warning : ''}</Text>
                </TouchableHighlight>);
            else
              warningView = <View />;

            // <View style={{flexDirection: "row"}} >
            //   <Text style={{fontSize:13, flex:1}}>{item.summary && item.expanded ? item.summary : ''}</Text>
            //   <MaterialIcons name={item.expanded ? 'expand-less' : 'expand-more'} size={14} />
            // </View>

            return (
              <TouchableHighlight underlayColor='#ffb944' onPress={() => this.handlePress(item, index)}>
              <View style={{flex:100, flexDirection: "row", paddingTop: 0, paddingBottom: 5, paddingRight: 5}}>
                {imageView}
                <View style={{flex:1, flexDirection: "column", paddingLeft: 10, paddingTop: 5}}>
                  <View style={{flexDirection: "row"}} >
                    <Text style={{fontSize: 18, fontFamily: 'montserrat', flex:1}}>{item.title}</Text>
                    <Text style={{fontSize: 18, fontWeight: "bold"}}>{item.temperature + '°'}</Text>
                  </View>
                  <Text style={{fontSize:13, flex:1}}>{item.summary && item.expanded ? item.summary : ''}</Text>
                  {warningView}
                </View>
              </View>
              </TouchableHighlight>);
            }}
          keyExtractor={item => item.title}
          ItemSeparatorComponent={({highlighted}) => (
            <View style={{height: 1, backgroundColor: "#eeeeee"}} />
            )}
          ListFooterComponent={({highlighted}) => (
            <View style={{height: 1, backgroundColor: "#dddddd"}} />
            )}
          refreshing={this.state.isLoading}
          onRefresh={this.handleRefresh}
        />
      </View>
    );
  }

  iconCodeToName = (iconCode) => {
    if (!CurrentLocation.isString(iconCode))
      return require('../assets/images/clever_weather.png');

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
    return require('../assets/images/clever_weather.png');
  }
};
