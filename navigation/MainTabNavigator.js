import React from 'react';
import { Platform, SafeAreaView } from 'react-native';
import { createStackNavigator, createBottomTabNavigator, createMaterialTopTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import LocationScreen from '../screens/LocationScreen';
import NearbyScreen from '../screens/NearbyScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import BrowseScreen from '../screens/BrowseScreen';
import CityListScreen from '../screens/CityListScreen';
import SearchScreen from '../screens/SearchScreen';

const navOptions = {
  headerStyle: {
    backgroundColor: '#FF8800',
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

const NearbyStack = createStackNavigator(
  {
    Nearby: NearbyScreen,
  },
  config
);
NearbyStack.navigationOptions = {
  tabBarLabel: () => {},
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='MaterialIcons' name='near-me' />
  ),
};
NearbyStack.path = '';

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

let createFunc = createBottomTabNavigator;
if (Platform.OS === 'android')
  createFunc = createMaterialTopTabNavigator;

const tabNavigator = createFunc({
  LocationStack,
  //NearbyStack,
  FavoritesStack,
  BrowseStack,
  SearchStack,
}, {
  tabBarPosition: 'bottom',
  tabBarOptions: {
    style: {
      backgroundColor: '#FFFFFF',
    },
    indicatorStyle: {
      backgroundColor: '#FF8800',
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
