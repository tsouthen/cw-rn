import React from 'react';
import { Platform, View, Text, Appearance, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';
import HeaderBar from '../components/HeaderBar';
import { Icon } from '../components/Icon';
import { Button, RadioButton, Switch, useTheme } from 'react-native-paper';

export default function SettingsScreen({ navigation }) {
  const { settings } = React.useContext(SettingsContext);
  return (
    <View style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}>
      <HeaderBar title="Settings" navigation={navigation} showBackButton={true} />
      <View style={{ flexDirection: 'column' }} >
        <SettingRow title='Appearance' name='yin-yang' type='material-community' />
        <AppearanceButtons />
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

  return <RadioButton.Group onValueChange={onPress} value={mode}>
    <SettingRadio title="Automatic" value="auto" onPress={onPress} />
    <SettingRadio title="Light" value="light" onPress={onPress} />
    <SettingRadio title="Dark" value="dark" onPress={onPress} />
  </RadioButton.Group>;
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
  const { name, type, title } = props;
  const viewStyle = { flexDirection: 'row', margin: 5, marginLeft: 10, alignItems: 'center' };
  const theme = useTheme();
  const color = theme.dark ? 'white' : 'black';
  const textStyle = { flex: 1, fontSize: 18, fontFamily: 'montserrat', color: color, marginLeft: 0 };

  return (
    <View style={viewStyle}>
      {name && <Icon style={{ marginRight: 10 }} {...{ name, type }} color={color} />}
      <Text style={textStyle}>{title}</Text>
      {props.children}
    </View>);
}

function SettingRadio(props) {
  const viewStyle = { flexDirection: 'row', margin: 5, marginLeft: 45, alignItems: 'center' };
  const theme = useTheme();
  const color = theme.dark ? 'white' : 'black';
  const textStyle = { flex: 1, fontSize: 16, fontFamily: 'montserrat', color: color, marginLeft: 0 };

  return (
      <TouchableOpacity style={viewStyle} onPress={() => props.onPress(props.value)}>
        {Platform.OS === 'android' && <RadioButton value={props.value} color={Colors.primary} />}
        <Text style={textStyle}>{props.title}</Text>
        {Platform.OS !== 'android' && <RadioButton value={props.value} color={Colors.primary} />}
      </TouchableOpacity>
  );
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