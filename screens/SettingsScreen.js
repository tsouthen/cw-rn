import React from 'react';
import { View } from 'react-native';
import { ListItem } from 'react-native-elements';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';

export default function SettingsScreen({ navigation }) {
  const settings = React.useContext(SettingsContext);

  React.useEffect(() => {
    navigation.setOptions({
      title: 'Settings',
    });
  }, [navigation]);

  updateSetting = (propName, value) => {
    settings.updateSettings({ [propName]: value });
  };

  getSwitchProps = (propName) => {
    return {
      thumbColor: Colors.primaryDark,
      trackColor: { false: '#b2b2b2', true: Colors.primary },
      value: settings[propName],
      onValueChange: (value) => {
        updateSetting(propName, value);
      },
    };
  };

  handlePress = (propName) => {
    updateSetting(propName, !settings[propName]);
  };

  return (
    <View style={{ flexDirection: 'column' }} >
      <ListItem title='Night Forecasts'
        onPress={() => { handlePress('night') }}
        titleStyle={{ fontFamily: 'montserrat' }}
        subtitle='Show overnight city forecasts.'
        leftIcon={{ name: 'md-moon', type: 'ionicon', color: 'black' }}
        switch={getSwitchProps('night')}
        underlayColor={Colors.primaryLight}
      />
      <ListItem title='Rounded Temperature'
        onPress={() => { handlePress('round') }}
        titleStyle={{ fontFamily: 'montserrat' }}
        subtitle='Round current temperature to the nearest degree.'
        leftIcon={{ name: 'decimal-decrease', type: 'material-community', color: 'black' }}
        switch={getSwitchProps('round')}
        underlayColor={Colors.primaryLight}
      />
    </View>
  );
};
