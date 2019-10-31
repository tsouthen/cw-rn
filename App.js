import { AppLoading } from 'expo';
import * as Font from 'expo-font';
import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, View, SafeAreaView, AsyncStorage } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { Entypo, MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from './constants/Colors';
import { SettingsContext } from './components/SettingsContext'

class KeyValueStore {
  static async setItem(key, value) {
      try {
        return await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('AsyncStorage#setItem error: ' + error.message);
      }
  };

  static async getItem(key) {
    return await AsyncStorage.getItem(key)
      .then((result) => {
        if (result) {
          try {
            result = JSON.parse(result);
          } catch (e) {
            console.error('AsyncStorage#getItem error deserializing JSON for key: ' + key, e.message);
          }
        }
        return result;
      });
  };

  static async removeItem(key) {
    return await AsyncStorage.removeItem(key);
  }
}

class AppComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      round: true,
      night: false,
      update: this.updateSettings,
    }
  }

  updateSettings = (settings) => {
    let newSettings = {
      night: settings.night,
      round: settings.round,
    }
    this.setState(newSettings, () => this.saveSettings(newSettings));
  }

  async componentDidMount() {
    await this.loadSettings();
  }

  async loadSettings() {
    let savedSettings = await KeyValueStore.getItem('Settings');
    if (savedSettings) {
      let newSettings = {};
      if ('night' in savedSettings)
        newSettings.night = savedSettings.night;
      if ('round' in savedSettings)
        newSettings.round = savedSettings.round;

      if (Object.keys(newSettings).length > 0) {
        this.setState(newSettings);
      }
    }
  }

  async saveSettings(settings) {
    await KeyValueStore.setItem('Settings', settings);
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.primaryDark }}>
        <SettingsContext.Provider value={this.state}>
          <View style={styles.container}>
            {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
            <AppNavigator />
          </View>
        </SettingsContext.Provider>
      </SafeAreaView>
    );
  }
}

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return (
      <AppLoading
        startAsync={loadResourcesAsync}
        onError={handleLoadingError}
        onFinish={() => handleFinishLoading(setLoadingComplete)}
      />
    );
  } else {
    return (
      <AppComponent />
    );
  }
}

async function loadResourcesAsync() {
  await Promise.all([
    // Asset.loadAsync([
    //   require('./assets/images/robot-dev.png'),
    //   require('./assets/images/robot-prod.png'),
    // ]),
    Font.loadAsync({
      'montserrat': require('./assets/fonts/montserrat.ttf'),
      //Icons used in the tabs
      ...Entypo.font,
      ...MaterialIcons.font,
      ...MaterialCommunityIcons.font,
      ...Ionicons.font,
      ...FontAwesome.font,
    }),
  ]);
}

function handleLoadingError(error) {
  // In this case, you might want to report the error to your error reporting service, for example Sentry
  console.warn(error);
}

function handleFinishLoading(setLoadingComplete) {
  setLoadingComplete(true);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});
