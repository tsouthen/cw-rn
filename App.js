import * as Font from 'expo-font';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View, Button } from 'react-native';
import { SplashScreen } from 'expo';
import { Entypo, MaterialIcons, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
import SearchScreen from './screens/SearchScreen';
import BrowseScreen from './screens/BrowseScreen';
import CityListScreen from './screens/CityListScreen';
// import LocationScreen from './screens/LocationScreen';
// import SettingsScreen from './screens/SettingsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBarIcon from './components/TabBarIcon';
import { NavigationHeaderButton } from './components/HeaderButton';

function LocationScreen({ navigation, route }) {
  navigation.setOptions({
    headerTitle: route?.params?.location ?? "Location",
    headerRight: () => (<NavigationHeaderButton type='material' name='settings' navigation={navigation} routeName='Settings' />)
  });
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title="Go to Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
}

function LocationStackScreen() {
  const LocationStack = createStackNavigator();
  return (
    <LocationStack.Navigator screenOptions={defaultScreenOptions}>
      <LocationStack.Screen name="Location" component={LocationScreen} />
      <LocationStack.Screen name="Settings 2" component={SettingsScreen} />
      {/* other screens */}
    </LocationStack.Navigator>
  );
}

function FavoritesScreen({ navigation }) {
  navigation.setOptions({
    headerTitle: "Favourites",
  });
  return <View />;
}

function FavoritesStackScreen(props) {
  const FavoritesStack = createStackNavigator();
  return (
    <FavoritesStack.Navigator screenOptions={defaultScreenOptions}>
      <FavoritesStack.Screen name="Favorites" component={FavoritesScreen} />
      {/* other screens */}
    </FavoritesStack.Navigator>
  );
}

function EmptyBrowseScreen({ navigation }) {
  navigation.setOptions({
    headerTitle: "Browse",
  });
  return <View />;
}

function BrowseStackScreen(props) {
  const BrowseStack = createStackNavigator();
  return (
    <BrowseStack.Navigator screenOptions={defaultScreenOptions}>
      <BrowseStack.Screen name="Browse" component={BrowseScreen} />
      <BrowseStack.Screen name="CityList" component={CityListScreen} />
      <BrowseStack.Screen name="City" component={LocationScreen} />
      <BrowseStack.Screen name="Search" component={SearchScreen} />
      {/* other screens */}
    </BrowseStack.Navigator>
  );
}

function SettingsScreen({ navigation }) {
  navigation.setOptions({
    headerTitle: "Settings",
  });
  return <View />;
}

function HomeTabs() {
  const Tab = createBottomTabNavigator();
  return (
    <Tab.Navigator screenOptions={defaultScreenOptions}>
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

  // <Stack.Screen name="Search" component={SearchScreen} />
  // <Stack.Screen name="City" component={LocationScreen} />
  // <Stack.Screen name="Settings" component={SettingsScreen} />

  //  <Stack.Screen name="Root" component={HomeTabs} options={{ header: () => { return null } }} />

  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return null;
  } else {
    return (
      <ShareContext.Provider value={{ onShare }}>
        <SettingsContext.Provider value={{ ...settings, updateSettings }}>
          <FavoritesContext.Provider value={{ favorites, updateFavorites }}>
            <View ref={mainViewRef} style={styles.container}>
              {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
              <NavigationContainer ref={containerRef} initialState={initialNavigationState}>
                <Stack.Navigator screenOptions={defaultScreenOptions}>
                  <Stack.Screen name="Root" component={HomeTabs} options={{ header: () => { return null } }} />
                  <Stack.Screen name="CityList" component={CityListScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </View>
          </FavoritesContext.Provider>
        </SettingsContext.Provider>
      </ShareContext.Provider>
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
