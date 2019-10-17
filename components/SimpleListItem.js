import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function SimpleListItem(props) {
  // console.debug(JSON.stringify(props));
  return (
    <TouchableHighlight style={{flex:1}} underlayColor='#ffb944' onPress={props.itemPress}>
      <View style={{flexDirection:'row', margin:5 }}>
        <Text {...props} style={[props.style, { flex:1, fontSize: 18, fontFamily: 'montserrat' }]} />
        <MaterialIcons name='navigate-next' size={24} />
      </View>
    </TouchableHighlight>
  );
}
