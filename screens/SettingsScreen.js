import React from 'react';
import { View, Platform } from 'react-native';
import { ListItem } from 'react-native-elements';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';
import HeaderBar from '../components/HeaderBar';

export default function SettingsScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <HeaderBar title="Settings" showBackButton={true} navigation={navigation} />
      <View style={{ flexDirection: 'column' }} >
        <SettingItem
          title='Night Forecasts'
          subtitle='Show overnight city forecasts.'
          leftIcon={{ name: 'md-moon', type: 'ionicon', color: 'black' }}
          propName='night'
        />
        <SettingItem
          title='Rounded Temperature'
          subtitle='Round current temperature to the nearest degree.'
          leftIcon={{ name: 'decimal-decrease', type: 'material-community', color: 'black' }}
          propName='round'
        />
      </View>
    </View>
  );
};

function SettingItem(props) {
  const { propName } = props;
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const [turnedOn, setTurnedOn] = React.useState(settings[propName]);

  const onValueChanged = (value) => {
    setTurnedOn(value);
    updateSetting(propName, value);
  }

  return (
    <ListItem
      onPress={() => onValueChanged(!turnedOn)}
      titleStyle={{ fontFamily: 'montserrat' }}
      underlayColor={Colors.primaryLight}
      switch={{
        thumbColor: Platform.OS === 'ios' ? 'white' : Colors.primaryDark,
        trackColor: { false: '#b2b2b2', true: Colors.primary },
        value: turnedOn,
        onValueChange: (value) => { onValueChanged(value) },
      }}
      {...props}
    />);
}