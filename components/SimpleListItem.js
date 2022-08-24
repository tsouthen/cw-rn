import React from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { Icon } from 'react-native-elements';
import Colors from '../constants/Colors';

export function SimpleListItem(props) {
  const { onPress, onPressIn, onLongPress, onPressOut, isActive, editing, onDelete, ...otherProps } = props;
  const viewStyle = { flex: 100, flexDirection: 'row', margin: 5, marginLeft: 10, alignItems: 'center' };
  const touchableStyle = { flex: 1 };
  if (isActive)
    touchableStyle.backgroundColor = Colors.primaryLight;
  return (
    <TouchableHighlight style={touchableStyle} underlayColor={Colors.primaryLight} {...{ onPress, onPressIn, onLongPress, onPressOut }} >
      <View style={viewStyle}>
        {editing && onDelete && <Icon name='x-circle' type='feather' size={22} color={Colors.primaryDark} onPress={onDelete} />}
        <Text {...otherProps} style={{ marginLeft: 10, flex: 1, fontSize: 18, fontFamily: 'montserrat' }} />
        <Icon name={editing ? 'drag-handle' : 'navigate-next'} type='material' size={24} color='#888888' />
      </View>
    </TouchableHighlight>
  );
}
