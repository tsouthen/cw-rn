import React from 'react';
import CityListScreen from './CityListScreen';

export default function NearbyScreen(props) {
  return (
    <CityListScreen cities={props.navigation.cities} {...props} />
  );
};

NearbyScreen.navigationOptions = {
  title: 'Nearby',
};