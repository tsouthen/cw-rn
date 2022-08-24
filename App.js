import * as Font from 'expo-font';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { Entypo, MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from './constants/Colors';
import { SettingsContext } from './components/SettingsContext'
import { FavoritesContext } from './components/FavoritesContext'
import { defaultFavorites } from './screens/FavoritesScreen';
import { ShareContext } from './components/ShareContext';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { JsonStorage } from './components/JsonStorage';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import useLinking from './navigation/useLinking';

const Stack = createStackNavigator();

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);
  const [initialNavigationState, setInitialNavigationState] = React.useState();
  const containerRef = React.useRef();
  const { getInitialState } = useLinking(containerRef);
  const [settings, setSettings] = React.useState({ round: true, night: false });
  const [favorites, setFavorites] = React.useState(defaultFavorites);
  const mainViewRef = React.useRef();

  saveSettings = async (updatedSettings) => {
    await JsonStorage.setItem('Settings', updatedSettings);
  }

  updateSettings = (updatedSettings) => {
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  }

  loadSettings = async () => {
    let savedSettings = await JsonStorage.getItem('Settings');
    if (savedSettings !== null && typeof savedSettings === 'object')
      setSettings(savedSettings);
  }

  saveFavorites = async (updatedFavorites) => {
    await JsonStorage.setItem('Favorites', updatedFavorites);
  }

  updateFavorites = (updatedFavorites) => {
    setFavorites(updatedFavorites);
    saveFavorites(updatedFavorites)
  }

  loadFavorites = async () => {
    let savedFavorites = await JsonStorage.getItem('Favorites');
    if (savedFavorites !== null && Array.isArray(savedFavorites)) {
      setFavorites(saveFavorites);
    }
  }

  onShare = async () => {
    if (!mainViewRef) {
      alert("Sorry, no view to share!");
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 250)); //so any UI animations can settle
      let uri = await captureRef(mainViewRef, { format: "jpg", quality: 0.9 });
      await Sharing.shareAsync(uri, { mimeType: "image/jpg", dialogTitle: "Share forecast" });
    } catch (error) {
      console.error("Error getting screenshot: " + error);
    }
  }

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHide();

        // Load our initial navigation state
        setInitialNavigationState(await getInitialState());

        // Load fonts
        await Font.loadAsync({
          'montserrat': require('./assets/fonts/montserrat.ttf'),
          //Icons used in the tabs
          ...Entypo.font,
          ...MaterialIcons.font,
          ...MaterialCommunityIcons.font,
          ...Ionicons.font,
          ...FontAwesome.font,
        });

        await loadSettings();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hide();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return null;
  } else {
    return (
      <ShareContext.Provider value={{ onShare }}>
        <SettingsContext.Provider value={{ ...settings, updateSettings }}>
          <FavoritesContext.Provider value={{ ...favorites, updateFavorites }}>
            <View ref={mainViewRef} style={styles.container}>
              {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
              <NavigationContainer ref={containerRef} initialState={initialNavigationState}>
                <Stack.Navigator>
                  <Stack.Screen name="Root" component={BottomTabNavigator} />
                </Stack.Navigator>
              </NavigationContainer>
            </View>
          </FavoritesContext.Provider>
        </SettingsContext.Provider>
      </ShareContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});
