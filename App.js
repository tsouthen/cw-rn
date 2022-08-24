import { AppLoading } from 'expo';
import * as Font from 'expo-font';
import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, View, SafeAreaView, AsyncStorage } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { Entypo, MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from './constants/Colors';
import { SettingsContext } from './components/SettingsContext'
import { FavoritesContext } from './components/FavoritesContext'
import { defaultFavorites } from './screens/FavoritesScreen';

class JsonStorage {
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
      updateSettings: this.updateSettings,
      favorites: defaultFavorites,
      updateFavorites: this.updateFavorites,
    }
  }

  async componentDidMount() {
    await this.loadSettings();
    await this.loadFavorites();
  }

  updateSettings = (settings) => {
    this.setState(settings, () => {
      this.saveSettings({round: this.state.round, night: this.state.night});
    });
  }  

  loadSettings = async () => {
    let savedSettings = await JsonStorage.getItem('Settings');
    if (savedSettings !== null && typeof savedSettings === 'object')
      this.setState(savedSettings);
  }

  async saveSettings(settings) {
    await JsonStorage.setItem('Settings', settings);
  }

  updateFavorites = (favorites) => {
    this.setState({favorites: favorites}, () => {
      this.saveFavorites(favorites);
    });
  }

  loadFavorites = async () => {
    let savedFavorites = await JsonStorage.getItem('Favorites');
    if (savedFavorites !== null && Array.isArray(savedFavorites)) {
      this.setState({favorites: savedFavorites});
    }
  }

  async saveFavorites(favorites) {
    await JsonStorage.setItem('Favorites', favorites);
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.primaryDark }}>
        <SettingsContext.Provider value={this.state}>
          <FavoritesContext.Provider value={this.state}>
            <View style={styles.container}>
              {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
              <AppNavigator />
            </View>
          </FavoritesContext.Provider>
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
