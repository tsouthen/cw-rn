import React from 'react';
import { View, Platform } from 'react-native';
import { ListItem } from 'react-native-elements';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';
import HeaderBar from '../components/HeaderBar';

export default function SettingsScreen({ navigation }) {
  const { settings } = React.useContext(SettingsContext);
  return (
    <View style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}>
      <HeaderBar title="Settings" navigation={navigation} />
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

function SettingItem(props) {
  const { propName, name, type } = props;
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const [turnedOn, setTurnedOn] = React.useState(settings[propName]);

  const onValueChanged = (value) => {
    setTurnedOn(value);
    updateSetting(propName, value);
  }

  return (
    <ListItem
      containerStyle={{ backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}
      titleStyle={{ fontFamily: 'montserrat', color: settings.dark ? 'white' : 'black' }}
      subtitleStyle={{ fontFamily: 'montserrat', color: settings.dark ? 'white' : 'black' }}
      underlayColor={Colors.primaryLight}
      leftIcon={{ name, type, color: settings.dark ? 'white' : 'black', size: 36 }}
      switch={{
        thumbColor: Platform.OS === 'ios' ? 'white' : Colors.primaryDark,
        trackColor: { false: '#b2b2b2', true: Colors.primary },
        ios_backgroundColor: '#eeeeee',
        value: turnedOn,
        onValueChange: (value) => { onValueChanged(value) },
      }}
      {...props}
    />);
}