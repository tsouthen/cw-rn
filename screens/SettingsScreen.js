import React from 'react';
import { View } from 'react-native';
import { ListItem } from 'react-native-elements';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Settings',
  };

  constructor(props) {
    super(props);
    this.state = {
      night: false,
      round: true,
    };
  };

  async componentDidMount() {
    if (this.context) {
      this.setState({
        night: this.context.night,
        round: this.context.round,
      });
    }
  };

  switchProps(propName) {
    return {
      thumbColor: Colors.primaryDark,
      trackColor: {false: '#b2b2b2', true: Colors.primary},
      value: this.state && this.state[propName],
      onValueChange: (value) => {
        this.setState({[propName]: value}, () => {
          this.context.update(this.state);
        });
      },
    };
  };

  handlePress(propName) {
    this.setState({[propName]: !this.state[propName]}, () => {
      this.context.update(this.state);
    });
  };

  render() {
    return (
      <View style={{flexDirection:'column'}} >
        <ListItem title='Night Forecasts' 
          onPress={() => {this.handlePress('night')}}
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Show overnight city forecasts.' 
          leftIcon={{name: 'md-moon', type: 'ionicon', color: 'black'}}
          switch={this.switchProps('night')}
        />
        <ListItem title='Rounded Temperature' 
          onPress={() => {this.handlePress('round')}}
          titleStyle={{fontFamily: 'montserrat'}}
          subtitle='Round current temperature to the nearest degree.' 
          leftIcon={{name: 'decimal-decrease', type: 'material-community', color: 'black'}}
          switch={this.switchProps('round')}
        />
      </View>
    );
  }
};

SettingsScreen.contextType = SettingsContext;
