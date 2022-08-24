import React from 'react';
import { Ionicons, Entypo, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import Colors from '../constants/Colors';

//style: { marginBottom: -3 },

export default function TabBarIcon(props) {
  var iconProps = {
    name: props.name,
    size: 32,
    // style: { marginBottom: -32 },
    color: props.focused ? Colors.tabIconSelected : Colors.tabIconDefault,
  };
  if (props.library === 'Entypo')
    return (<Entypo {...iconProps} />);

  if (props.library === 'MaterialIcons')
    return (<MaterialIcons {...iconProps} />);

  if (props.library === 'FontAwesome')
    return (<FontAwesome {...iconProps} />);

  return (<Ionicons {...iconProps} />);
}
