// import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { DarkTheme, DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { captureRef } from 'react-native-view-shot';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FavoritesContext } from './components/FavoritesContext';
import { JsonStorage } from './components/JsonStorage';
import { SettingsContext } from './components/SettingsContext';
import { ShareContext } from './components/ShareContext';
import TabBarIcon from './components/TabBarIcon';
import Colors from './constants/Colors';
import useLinking from './navigation/useLinking';
import BrowseScreen from './screens/BrowseScreen';
import CityListScreen from './screens/CityListScreen';
import FavoritesScreen, { defaultFavorites } from './screens/FavoritesScreen';
import LocationScreen from './screens/LocationScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';

function LocationStackScreen() {
  const LocationStack = createStackNavigator();
  return (
    <LocationStack.Navigator screenOptions={defaultScreenOptions} headerMode='none'>
      <LocationStack.Screen name="Location" component={LocationScreen} />
      <LocationStack.Screen name="City" component={LocationScreen} />
    </LocationStack.Navigator>
  );
}

function FavoritesStackScreen(props) {
  const FavoritesStack = createStackNavigator();
  return (
    <FavoritesStack.Navigator screenOptions={defaultScreenOptions} headerMode='none'>
      <FavoritesStack.Screen name="Favorites" component={FavoritesScreen} />
      <FavoritesStack.Screen name="City" component={LocationScreen} />
    </FavoritesStack.Navigator>
  );
}

function BrowseStackScreen(props) {
  const BrowseStack = createStackNavigator();
  return (
    <BrowseStack.Navigator screenOptions={defaultScreenOptions} headerMode='none'>
      <BrowseStack.Screen name="Browse" component={BrowseScreen} />
      <BrowseStack.Screen name="CityList" component={CityListScreen} />
      <BrowseStack.Screen name="City" component={LocationScreen} />
      <BrowseStack.Screen name="Search" component={SearchScreen} />
    </BrowseStack.Navigator>
  );
}

function SettingsStackScreen(props) {
  const SettingsStack = createStackNavigator();
  return (
    <SettingsStack.Navigator screenOptions={defaultScreenOptions} headerMode='none'>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
}

function HomeTabs() {
  const { settings } = React.useContext(SettingsContext);
  let Tab;
  let tabOptions;
  if (Platform.OS === "ios") {
    Tab = createBottomTabNavigator();
    tabOptions = {
      tabBarOptions: {
        activeTintColor: Colors.primaryDark,
        labelPosition: 'below-icon,',
        inactiveBackgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground,
        activeBackgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground,
      }
    }
  } else {
    Tab = createMaterialBottomTabNavigator();
    // tabOptions = {
    //   activeColor: 'white',
    //   inactiveColor: '#505050',
    //   barStyle: { backgroundColor: Colors.primary },
    tabOptions = {
      activeColor: Colors.primaryDark,
      barStyle: { backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground },
      // shifting: false,
    }
  }
  return (
    <Tab.Navigator screenOptions={defaultScreenOptions}
      {...tabOptions}
    >
      <Tab.Screen name="Location" component={LocationStackScreen}
        options={{
          title: 'Location',
          tabBarIcon: ({ focused, color, size }) => <TabBarIcon focused={focused} type='feather' name='map-pin' color={color} size={size} />
        }}
      />
      <Tab.Screen name="Favourites" component={FavoritesStackScreen}
        options={{
          title: "Favourites", tabBarIcon: ({ focused, color, size }) => <TabBarIcon focused={focused} type='feather' name='star' color={color} size={size} />
        }}
      />
      <Tab.Screen name="Browse" component={BrowseStackScreen}
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused, color, size }) => <TabBarIcon focused={focused} type='feather' name='globe' color={color} size={size} />
        }}
      />
      <Tab.Screen name="Search" component={SettingsStackScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => <TabBarIcon focused={focused} type='feather' name='sliders' color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);
  const [initialNavigationState, setInitialNavigationState] = React.useState();
  const containerRef = React.useRef();
  const { getInitialState } = useLinking(containerRef);
  const [settings, setSettings] = React.useState({ round: true, night: false, dark: false });
  const [favorites, setFavorites] = React.useState(defaultFavorites);
  const mainViewRef = React.useRef();
  const Stack = createStackNavigator();

  saveSettings = async (updatedSettings) => {
    await JsonStorage.setItem('Settings', updatedSettings);
  }

  updateSetting = (prop, value) => {
    let newSettings = { ...settings };
    newSettings[prop] = value;
    setSettings(newSettings);
    saveSettings(newSettings);
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
    const newFavs = updatedFavorites.slice();
    setFavorites(newFavs);
    saveFavorites(newFavs)
  }

  loadFavorites = async () => {
    let savedFavorites = await JsonStorage.getItem('Favorites');
    if (savedFavorites !== null && Array.isArray(savedFavorites)) {
      setFavorites(savedFavorites);
    }
  }

  onShare = async () => {
    if (!mainViewRef) {
      alert("Sorry, no view to share!");
      return;
    }

    if (!Sharing.isAvailableAsync()) {
      alert("Sorry, sharing not available on this platform.");
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 250)); //so any UI animations can settle
      let uri = await captureRef(mainViewRef, { format: "jpg", quality: 0.9 });
      const prefix = "file://";
      if (!uri.startsWith(prefix))
        uri = prefix + uri;
      await Sharing.shareAsync(uri, { mimeType: "image/jpeg", dialogTitle: "Share forecast", UTI: "public.image" });
    } catch (error) {
      console.error("Error getting screenshot: " + error);
    }
  }

  // Load any resources or data that we need prior to rendering the app
  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Load our initial navigation state
        setInitialNavigationState(await getInitialState());

        // Load fonts
        await Font.loadAsync({
          'montserrat': require('./assets/fonts/montserrat.ttf'),
          //Icons used in the app
          ...MaterialIcons.font,
          ...MaterialCommunityIcons.font,
          ...Feather.font,
        });

        await loadSettings();
        await loadFavorites();
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return null;
  } else {
    return (
      <PaperProvider theme={theme}>
        <ShareContext.Provider value={{ onShare }}>
          <SettingsContext.Provider value={{ settings, updateSetting }}>
            <FavoritesContext.Provider value={{ favorites, updateFavorites }}>
              <SafeAreaProvider>
                {/* {Platform.OS === 'ios' && <StatusBar barStyle="default" />} */}
                <NavigationContainer ref={containerRef} initialState={initialNavigationState} >
                  <View ref={mainViewRef} style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}>
                    <Stack.Navigator headerMode='none'>
                      <Stack.Screen name="Root" component={HomeTabs} />
                      {/* <Stack.Screen name="CityList" component={CityListScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} /> */}
                    </Stack.Navigator>
                  </View>
                </NavigationContainer>
                {/* <StatusBar /> */}
              </SafeAreaProvider>
            </FavoritesContext.Provider>
          </SettingsContext.Provider>
        </ShareContext.Provider>
      </PaperProvider >
    );
  }
}

const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: '#ff8800',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontFamily: 'montserrat',
  },
};

// text: 'white',
// placeholder: 'white',

const theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF8800',
    accent: '#f1c40f',
    surface: '#FF8800',
  },
};

const darkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF8800',
    accent: '#f1c40f',
    surface: '#FF8800',
  },
};
