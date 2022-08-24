import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as React from 'react';

import TabBarIcon from '../components/TabBarIcon';
// import LocationScreen from '../screens/LocationScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import BrowseScreen from '../screens/BrowseScreen';

const BottomTab = createBottomTabNavigator();
// const INITIAL_ROUTE_NAME = 'Favourites';

export default function BottomTabNavigator({ navigation, route }) {
  // Set the header title on the parent stack navigator depending on the
  // currently active tab. Learn more in the documentation:
  // https://reactnavigation.org/docs/en/screen-options-resolution.html
  // React.useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerTitle: getHeaderTitle(route),
  //     headerRight: () => {
  //       if (route.state?.routes[route.state.index]?.name === "Browse")
  //         return <Text>Search</Text>;
  //     }
  //   });
  // });

  //   <BottomTab.Screen
  //   name="Location"
  //   component={LocationScreen}
  //   options={{
  //     title: 'Location',
  //     tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='entypo' name='location-pin' />
  //   }}
  // />
  //  <BottomTab.Navigator initialRouteName={INITIAL_ROUTE_NAME}>

  return (
    <BottomTab.Navigator>
      <BottomTab.Screen
        name="Favourites"
        component={FavoritesScreen}
        options={{
          title: 'Favourites',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='font-awesome' name='star' />
        }}
      />
      <BottomTab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} type='font-awesome' name='globe' />
        }}
      />
    </BottomTab.Navigator>
  );
}

// function getHeaderTitle(route) {
//   const routeName = route.state?.routes[route.state.index]?.name ?? INITIAL_ROUTE_NAME;

//   switch (routeName) {
//     case 'Location':
//       return 'Location';
//     case 'Favourites':
//       return 'Favourites';
//     case 'Browse':
//       return 'Browse';
//   }
// }
