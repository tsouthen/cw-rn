import React from 'react';
import { View, Text, Switch, AsyncStorage } from 'react-native';
import { ListItem } from 'react-native-elements';
import Colors from '../constants/Colors';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Settings',
  };

  constructor(props) {
    super(props);
    this.state = {
      night: false,
      round: true,
      hourly: true,
    };
    global.settings = this.state;
  };

  async componentDidMount() {
    const settings = await AsyncStorage.getItem('Settings');
    if (settings) {
      global.settings = JSON.parse(settings);
      this.setState({settings: settings});
    }
  };

  switchProps = (propName) => {
    return {
      thumbColor: Colors.primaryDark,
      trackColor: {false: '#b2b2b2', true: Colors.primary},
      value: this.state[propName],
      onValueChange: (value) => {
        this.setState({[propName]: value}, () => global.settings = this.state);
        AsyncStorage.setItem('settings', JSON.stringify(this.state));
      },
    };
  };

  render() {
    return (
      <View style={{flexDirection:'column'}} >
        <ListItem title='Night Forecasts' 
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Show overnight city forecasts.' 
          leftIcon={{name: 'md-moon', type: 'ionicon', color: 'black'}}
          switch={this.switchProps('night')}
        />
        <ListItem title='Hourly Forecasts' 
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Show 24-hour city forecasts.' 
          leftIcon={{name: 'access-time', type: 'material', color: 'black'}}
          switch={this.switchProps('hourly')}
        />
        <ListItem title='Rounded Temperature' 
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Round current temperature to the nearest degree.' 
          leftIcon={{name: 'decimal-decrease', type: 'material-community', color: 'black'}}
          switch={this.switchProps('round')}
        />
      </View>
    );
  }
};
