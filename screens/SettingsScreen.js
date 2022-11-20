import React from 'react';
import { View, Text, Appearance } from 'react-native';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';
import HeaderBar from '../components/HeaderBar';
import { Icon } from '../components/Icon';
import { Button, Switch, useTheme } from 'react-native-paper';

export default function SettingsScreen({ navigation }) {
  const { settings } = React.useContext(SettingsContext);
  return (
    <View style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}>
      <HeaderBar title="Settings" navigation={navigation} showBackButton={true} />
      <View style={{ flexDirection: 'column' }} >
        <SettingRow title='Appearance' name='yin-yang' type='material-community'>
          <AppearanceButtons />
        </SettingRow>
        <SettingSwitchRow
          title='Night Forecasts'
          subtitle='Show overnight city forecasts.'
          name='moon' type='feather'
          propName='night'
        />
        <SettingSwitchRow
          title='Rounded Temperature'
          subtitle='Round current temperature to the nearest degree.'
          // name='decimal-decrease' type='material-community'
          // name='hash' type='feather'
          name='rotate-ccw' type='feather'
          propName='round'
        />
      </View>
    </View>
  );
}

function AppearanceButtons(props) {
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const getMode = () => {
    if (settings.autoAppearance)
      return "auto";
    if (settings.dark)
      return "dark";
    return "light";
  }
  const [mode, setMode] = React.useState(getMode());

  const onPress = (mode) => {
    setMode(mode);
    const isAuto = mode === "auto";
    updateSetting({
      dark: isAuto ? Appearance.getColorScheme() === "dark" : mode === "dark",
      autoAppearance: isAuto,
    });
  }

  return <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: 'lightgray', borderRadius: 7, padding: 2 }}>
    <Button compact={true} onPress={() => onPress("light")} mode={mode === "light" ? "contained" : "text"}>Light</Button>
    <Button compact={true} onPress={() => onPress("auto")} mode={mode === "auto" ? "contained" : "text"}>Auto</Button>
    <Button compact={true} onPress={() => onPress("dark")} mode={mode === "dark" ? "contained" : "text"}>Dark</Button>
  </View>;
}

function useSetting(propName) {
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const [value, setTurnedOn] = React.useState(settings[propName]);

  const setValue = (value) => {
    setTurnedOn(value);
    updateSetting(propName, value);
  }

  return [value, setValue];
}

function SettingRow(props) {
  const { name, type, title, ...theRest } = props;
  const viewStyle = { flexDirection: 'row', margin: 5, marginLeft: 10, alignItems: 'center' };
  const theme = useTheme();
  const color = theme.dark ? 'white' : 'black';
  const textStyle = { flex: 1, fontSize: 18, fontFamily: 'montserrat', color: color, marginLeft: 0 };

  return (
    <View style={viewStyle}>
      <Icon style={{ marginRight: 10 }} {...{ name, type }} color={color} />
      <Text style={textStyle}>{title}</Text>
      {props.children}
    </View>);
}

function SettingSwitchRow(props) {
  const { propName, ...theRest } = props;
  const { settings, updateSetting } = React.useContext(SettingsContext);
  const [turnedOn, setTurnedOn] = React.useState(settings[propName]);

  const onValueChanged = (value) => {
    setTurnedOn(value);
    updateSetting(propName, value);
  }

  return (
    <SettingRow {...theRest}>
      <Switch color={Colors.primary} value={turnedOn} onValueChange={onValueChanged} />
    </SettingRow>
  );
}