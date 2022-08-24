import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function SimpleListItem(props) {
  const {onPress, onLongPress, onPressOut, ...otherProps} = props;
  const viewStyle = {flex:100, flexDirection:'row', margin:5, marginLeft: 10, alignContent:'center'};
  const touchableStyle = {flex:1};
  if (props.isActive)
    touchableStyle.backgroundColor = '#ffb944';
  return (
    <TouchableHighlight style={touchableStyle} underlayColor='#ffb944' {...{ onPress, onLongPress, onPressOut}} >
      <View style={viewStyle}>
        <Text {...otherProps} style={{ flex:1, fontSize: 18, fontFamily: 'montserrat' }} />
        <MaterialIcons name='navigate-next' size={24} style={{color:'#888888'}} />
      </View>
    </TouchableHighlight>
  );
}
