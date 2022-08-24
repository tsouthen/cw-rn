import React from 'react';
import { Platform, SafeAreaView } from 'react-native';
import { createStackNavigator, createBottomTabNavigator, createMaterialTopTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import LocationScreen from '../screens/LocationScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import BrowseScreen from '../screens/BrowseScreen';
import CityListScreen from '../screens/CityListScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';

import Colors from '../constants/Colors';

const navOptions = {
  headerStyle: {
    backgroundColor: Colors.primary,
  },
  headerForceInset: { 
    top: 'never' 
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontFamily: 'montserrat',
    fontWeight: 'normal',
    fontSize: 18
  }, 
};

const config = Platform.select({
  web: { headerMode: 'screen' },
  default: {
    defaultNavigationOptions: navOptions,
  },
});

const LocationStack = createStackNavigator(
  {
    Location: LocationScreen,
    CityList: CityListScreen,
    City: LocationScreen,
    Settings: SettingsScreen,
  },
  config
);
LocationStack.navigationOptions = {
  tabBarLabel: () => {},
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='Entypo' name='location-pin' />
  ),
};
LocationStack.path = '';

const FavoritesStack = createStackNavigator(
  {
    Favorites: FavoritesScreen,
    City: LocationScreen,
  },
  config
);
FavoritesStack.navigationOptions = {
  tabBarLabel: () => {},
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} name='ios-star' />
  ),
};
FavoritesStack.path = '';

const BrowseStack = createStackNavigator(
  {
    Browse: BrowseScreen,
    CityList: CityListScreen,
    City: LocationScreen,
    Search: SearchScreen,
  },
  config
);
BrowseStack.navigationOptions = {
  tabBarLabel: () => {},
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='FontAwesome' name='globe' />
  ),
};
BrowseStack.path = '';

const SearchStack = createStackNavigator(
  {
    Search: SearchScreen,
    City: LocationScreen,
  },
  config
);
SearchStack.navigationOptions = {
  tabBarLabel: () => {},
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='MaterialIcons' name='search' />
  ),
};
SearchStack.path = '';

const SettingsStack = createStackNavigator(
  {
    Settings: SettingsScreen,
    Search: SearchScreen,
  },
  config
);
SettingsStack.navigationOptions = {
  tabBarLabel: () => {},
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='MaterialIcons' name='settings' />
  ),
};
SettingsStack.path = '';

let createFunc = createBottomTabNavigator;
if (Platform.OS === 'android')
  createFunc = createMaterialTopTabNavigator;

const tabNavigator = createFunc({
  LocationStack,
  FavoritesStack,
  BrowseStack,
  //SearchStack,
  //SettingsStack,
}, {
  tabBarPosition: 'bottom',
  tabBarOptions: {
    style: {
      backgroundColor: '#FFFFFF',
      elevation: 1,
    },
    indicatorStyle: {
      backgroundColor: Colors.tabIconSelected,
    },
    showIcon: 'true',
    showLabel: 'false',
    tabStyle: {
      height: 50,
    },
    iconStyle: {
      height:60,
      width: 60,
    },
  }
});

tabNavigator.path = '';

export default tabNavigator;
