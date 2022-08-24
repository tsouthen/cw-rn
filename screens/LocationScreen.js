import React from 'react';
import { FlatList, ActivityIndicator, StyleSheet, Text, View, Image, TouchableHighlight  } from 'react-native';

export default function LocationScreen() {
  return (
    <CurrentLocation />
  );
}

LocationScreen.navigationOptions = {
  title: 'Location',
};

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

export class CurrentLocation extends React.Component {

  constructor(props) {
    super(props);
    this.state = { 
      isLoading: true,
      dataSource: [],
      expanded: [],
      }
  }

  componentDidMount() {
    this.makeRemoteRequest();
  }

  makeRemoteRequest = () => {
    var targetUrl = 'https://proxy.hackeryou.com/?reqUrl=https://dd.weather.gc.ca/citypage_weather/xml/BC/s0000656_e.xml&xmlToJSON=true';
    return fetch(targetUrl)
      .then((response) => response.json())
      .then((responseJson) => {
        var expanded = [];
        responseJson.siteData.forecastGroup.forecast.forEach((entry, index) => {
          //remove temperature summary from overall summary
          if (entry.temperatures.textSummary)
            entry.textSummary = entry.textSummary.replace(entry.temperatures.textSummary, '');
          expanded.push(false);
        });
        //create a new forecast entry for the current conditions
        var now = {
            period : { textForecastName: responseJson.siteData.location.name.$t },
            textSummary : responseJson.siteData.currentConditions.condition,
            expanded : true,
            abbreviatedForecast : { iconCode: responseJson.siteData.currentConditions.iconCode },
            temperatures : { temperature: responseJson.siteData.currentConditions.temperature },
        };
        responseJson.siteData.forecastGroup.forecast.unshift(now);
        expanded.unshift(true);
        this.setState({
          isLoading: false,
          dataSource: responseJson.siteData,
          expanded: expanded,
        }, function(){
        });
      })
      .catch((error) =>{
        console.error(error);
      });
  };

  handleRefresh = () => {
    if (this.state.isLoading)
      return;
    
    this.setState({ isLoading: true }, () => { this.makeRemoteRequest(); });   
  };

  handlePress = (item, index) => {
    //alert('Row pressed:' + index);
    var expanded = this.state.expanded;
    expanded[index] = !expanded[index];
    this.setState({ expanded: expanded});
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={{flex: 1}}>
          <Text>Loading...</Text>
          <ActivityIndicator/>
        </View>
      )
    }

//    <Text style={styles.title}>{this.state.dataSource.location.name.$t}</Text>

    return(
      <View style={{flex: 1}}>
        <FlatList
          data={ this.state.dataSource ? this.state.dataSource.forecastGroup.forecast : []}
          renderItem={({item, index}) => {
            //skip the night forecasts, except for tonight
            if (index !== 0 && item.temperatures.temperature.class === "low") {
              return <View></View>
            }
            return (             
              <TouchableHighlight underlayColor='#ffb944' onPress={() => this.handlePress(item, index)}>
              <View style={{flex:100, flexDirection: "row", paddingTop: 0, paddingBottom: 5, paddingRight: 5}}>
                <Image style={{width: 50, height: 50, resizeMode: "contain"}} source={this.iconCodeToName(item.abbreviatedForecast.iconCode.$t)} />
                <View style={{flex:1, flexDirection: "column", paddingLeft: 10, paddingTop: 5}}>
                  <View style={{flexDirection: "row"}} >
                    <Text style={{fontSize: 18, fontFamily: 'montserrat', flex:1}}>{item.period.textForecastName}</Text>
                    <Text style={{fontSize: 18, fontWeight: "bold"}}>{item.temperatures.temperature.$t + '°'}</Text>
                  </View>
                  <Text style={{fontSize: 13}}>{this.state.expanded && this.state.expanded[index] ? item.textSummary : ''}</Text>
                </View>
              </View>
              </TouchableHighlight>);
            }}
          keyExtractor={item => item.period.textForecastName}
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
    return require('../assets/images/sun.png');
  }
};
