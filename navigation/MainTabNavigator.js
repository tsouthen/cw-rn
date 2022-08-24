import React from 'react';
import { Platform, SafeAreaView } from 'react-native';
import { createStackNavigator, createBottomTabNavigator, createMaterialTopTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
// import HomeScreen from '../screens/HomeScreen';
import LocationScreen from '../screens/LocationScreen';
// import SettingsScreen from '../screens/SettingsScreen';
import NearbyScreen from '../screens/NearbyScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import BrowseScreen from '../screens/BrowseScreen';

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
  }, 
};

const config = Platform.select({
  web: { headerMode: 'screen' },
  default: {
    defaultNavigationOptions: navOptions,
  },
});

// const HomeStack = createStackNavigator(
//   {
//     Home: HomeScreen,
//   },
//   config
// );

// HomeStack.navigationOptions = {
//   tabBarLabel: 'Home',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon
//       focused={focused}
//       name={
//         Platform.OS === 'ios'
//           ? `ios-information-circle${focused ? '' : '-outline'}`
//           : 'md-information-circle'
//       }
//     />
//   ),
// };

// HomeStack.path = '';

const LocationStack = createStackNavigator(
  {
    Location: LocationScreen,
  },
  config
);
LocationStack.navigationOptions = {
  tabBarLabel: 'Location',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='Entypo' name='location-pin' />
  ),
};
LocationStack.path = '';

// const SettingsStack = createStackNavigator(
//   {
//     Settings: SettingsScreen,
//   },
//   config
// );
// SettingsStack.navigationOptions = {
//   tabBarLabel: 'Settings',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon focused={focused} name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'} />
//   ),
// };
// SettingsStack.path = '';

const NearbyStack = createStackNavigator(
  {
    Nearby: NearbyScreen,
  },
  config
);
NearbyStack.navigationOptions = {
  tabBarLabel: 'Nearby',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='MaterialIcons' name='near-me' />
  ),
};
NearbyStack.path = '';

const FavoritesStack = createStackNavigator(
  {
    Favorites: FavoritesScreen,
  },
  config
);
FavoritesStack.navigationOptions = {
  tabBarLabel: 'Favorites',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} name='ios-star' />
  ),
};
FavoritesStack.path = '';

const BrowseStack = createStackNavigator(
  {
    Browse: BrowseScreen,
  },
  config
);
BrowseStack.navigationOptions = {
  tabBarLabel: 'Browse',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} library='FontAwesome' name='globe' />
  ),
};
BrowseStack.path = '';

const tabNavigator = createMaterialTopTabNavigator({
  LocationStack,
  NearbyStack,
  FavoritesStack,
  BrowseStack,
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
