import * as Font from 'expo-font';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View, Button } from 'react-native';
import { SplashScreen } from 'expo';
import { Entypo, MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Colors from './constants/Colors';
import { SettingsContext } from './components/SettingsContext'
import { FavoritesContext } from './components/FavoritesContext'
import FavoritesScreen, { defaultFavorites } from './screens/FavoritesScreen';
import { ShareContext } from './components/ShareContext';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { JsonStorage } from './components/JsonStorage';
import useLinking from './navigation/useLinking';
import SearchScreen from './screens/SearchScreen';
import BrowseScreen from './screens/BrowseScreen';
import CityListScreen from './screens/CityListScreen';
import LocationScreen from './screens/LocationScreen';
import SettingsScreen from './screens/SettingsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBarIcon from './components/TabBarIcon';

function LocationStackScreen() {
  const LocationStack = createStackNavigator();
  return (
    <LocationStack.Navigator screenOptions={defaultScreenOptions} headerMode='none'>
      <LocationStack.Screen name="Location" component={LocationScreen} />
      <LocationStack.Screen name="Settings" component={SettingsScreen} />
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

function SearchStackScreen(props) {
  const SearchStack = createStackNavigator();
  return (
    <SearchStack.Navigator screenOptions={defaultScreenOptions} headerMode='none'>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="City" component={LocationScreen} />
    </SearchStack.Navigator>
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

function HomeTabs() {
  const Tab = createBottomTabNavigator();
  return (
    <Tab.Navigator screenOptions={defaultScreenOptions}
      tabBarOptions={{
        activeTintColor: Colors.primary,
      }}
    >
      <Tab.Screen name="Location" component={LocationStackScreen}
        options={{
          title: 'Location',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='entypo' name='location-pin' />
        }}
      />
      <Tab.Screen name="Favourites" component={FavoritesStackScreen}
        options={{
          title: "Favourites", tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='font-awesome' name='star' />
        }}
      />
      {/* <Tab.Screen name="Search" component={SearchStackScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='material-community' name='magnify' />
        }}
      /> */}
      <Tab.Screen name="Browse" component={BrowseStackScreen}
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='font-awesome' name='globe' />
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
  const [settings, setSettings] = React.useState({ round: true, night: false });
  const [favorites, setFavorites] = React.useState(defaultFavorites);
  const mainViewRef = React.useRef();
  const Stack = createStackNavigator();

  saveSettings = async (updatedSettings) => {
    await JsonStorage.setItem('Settings', updatedSettings);
  }

  updateSetting = (prop, value) => {
    settings[prop] = value;
    setSettings(settings);
    saveSettings(settings);
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

  // <Stack.Screen name="Search" component={SearchScreen} />
  // <Stack.Screen name="City" component={LocationScreen} />
  // <Stack.Screen name="Settings" component={SettingsScreen} />

  //  <Stack.Screen name="Root" component={HomeTabs} options={{ header: () => { return null } }} />

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return null;
  } else {
    return (
      <PaperProvider theme={theme}>
        <ShareContext.Provider value={{ onShare }}>
          <SettingsContext.Provider value={{ settings, updateSetting }}>
            <FavoritesContext.Provider value={{ favorites, updateFavorites }}>
              <View ref={mainViewRef} style={styles.container}>
                {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
                <NavigationContainer ref={containerRef} initialState={initialNavigationState}>
                  <Stack.Navigator headerMode='none'>
                    <Stack.Screen name="Root" component={HomeTabs} />
                    <Stack.Screen name="CityList" component={CityListScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});

// text: 'white',
// placeholder: 'white',

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF8800',
    accent: '#f1c40f',
  },
};
