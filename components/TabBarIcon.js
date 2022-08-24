import React from 'react';
import Colors from '../constants/Colors';
import { Icon } from 'react-native-elements';

export default function TabBarIcon(props) {
  const {focused} = props;
  return (<Icon size={32} color={focused ? Colors.tabIconSelected : 'black'} {...props} />);
};
