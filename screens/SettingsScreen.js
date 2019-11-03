import React from 'react';
import { View } from 'react-native';
import { ListItem } from 'react-native-elements';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Settings',
  };
  
  updateSetting = (propName, value) => {
    this.context.updateSettings({[propName]: value});
  };

  getSwitchProps = (propName) => {
    return {
      thumbColor: Colors.primaryDark,
      trackColor: {false: '#b2b2b2', true: Colors.primary},
      value: this.context && this.context[propName],
      onValueChange: (value) => {
        this.updateSetting(propName, value);
      },
    };
  };

  handlePress(propName) {
    this.updateSetting(propName, !this.context[propName]);
  };

  render() {
    return (
      <View style={{flexDirection:'column'}} >
        <ListItem title='Night Forecasts' 
          onPress={() => {this.handlePress('night')}}
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Show overnight city forecasts.' 
          leftIcon={{name: 'md-moon', type: 'ionicon', color: 'black'}}
          switch={this.getSwitchProps('night')}
          underlayColor={Colors.primaryLight}
        />
        <ListItem title='Rounded Temperature' 
          onPress={() => {this.handlePress('round')}}
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Round current temperature to the nearest degree.' 
          leftIcon={{name: 'decimal-decrease', type: 'material-community', color: 'black'}}
          switch={this.getSwitchProps('round')}
          underlayColor={Colors.primaryLight}
        />
      </View>
    );
  }
};

SettingsScreen.contextType = SettingsContext;
