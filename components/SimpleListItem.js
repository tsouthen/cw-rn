import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export function SimpleListItem(props) {
  // <View style={{ flex:100, height:1, backgroundColor: '#eeeeee' }} />
  return (
    <TouchableHighlight style={{flex:1}} underlayColor='#ffb944' onPress={props.itemPress}>
      <View style={{flex:100, flexDirection:'row', margin:5, alignContent:'center'}}>
        <Text {...props} style={[props.style, { flex:1, fontSize: 18, fontFamily: 'montserrat' }]} />
        <MaterialIcons name='navigate-next' size={24} style={{color:'#888888'}} />
      </View>
    </TouchableHighlight>
  );
}
