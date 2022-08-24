import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { Icon } from 'react-native-elements';
import Colors from '../constants/Colors';

export function SimpleListItem(props) {
  const {onPress, onLongPress, onPressOut, ...otherProps} = props;
  const viewStyle = {flex:100, flexDirection:'row', margin:5, marginLeft: 10, alignContent:'center'};
  const touchableStyle = {flex:1};
  if (props.isActive)
    touchableStyle.backgroundColor = Colors.primaryLight;
  return (
    <TouchableHighlight style={touchableStyle} underlayColor={Colors.primaryLight} {...{ onPress, onLongPress, onPressOut}} >
      <View style={viewStyle}>
        <Text {...otherProps} style={{ flex:1, fontSize: 18, fontFamily: 'montserrat' }} />
        <Icon name='navigate-next' type='material' size={24} color='#888888' />
      </View>
    </TouchableHighlight>
  );
}
