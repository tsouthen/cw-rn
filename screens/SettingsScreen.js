import React from 'react';
import { View, Text } from 'react-native';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';
import HeaderBar from '../components/HeaderBar';
import { Icon } from '../components/Icon';
import { Switch } from 'react-native-paper';

export default function SettingsScreen({ navigation }) {
  const { settings } = React.useContext(SettingsContext);
  return (
    <View style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}>
      <HeaderBar title="Settings" navigation={navigation} showBackButton={true} />
      <View style={{ flexDirection: 'column' }} >
        <SettingItem
          title='Night Forecasts'
          subtitle='Show overnight city forecasts.'
          name='moon' type='feather'
          propName='night'
        />
        <SettingItem
          title='Rounded Temperature'
          subtitle='Round current temperature to the nearest degree.'
          // name='decimal-decrease' type='material-community'
          // name='hash' type='feather'
          name='rotate-ccw' type='feather'
          propName='round'
        />
        <SettingItem
          title='Dark Mode'
          subtitle='Dark background with white text and icons.'
          name='yin-yang' type='material-community'
          propName='dark'
        />
      </View>
    </View>
  );
};

function useSetting(propName) {
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const [value, setTurnedOn] = React.useState(settings[propName]);

  const setValue = (value) => {
    setTurnedOn(value);
    updateSetting(propName, value);
  }

  return [value, setValue];
}

function SettingItem(props) {
  const { propName, name, type, title } = props;
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const [turnedOn, setTurnedOn] = React.useState(settings[propName]);
  const viewStyle = { flexDirection: 'row', margin: 5, marginLeft: 10, alignItems: 'center' };
  const color = settings.dark ? 'white' : 'black';
  const textStyle = { flex: 1, fontSize: 18, fontFamily: 'montserrat', color: color, marginLeft: 0 };

  const onValueChanged = (value) => {
    setTurnedOn(value);
    updateSetting(propName, value);
  }

  return (
    <View style={viewStyle}>
      <Icon style={{ marginRight: 10 }} {...{ name, type }} color={color} />
      <Text style={textStyle}>{title}</Text>
      <Switch color={Colors.primary} value={turnedOn} onValueChange={onValueChanged} />
    </View>);
}