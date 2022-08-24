import React from 'react';
import { Platform } from 'react-native';
import { Icon } from 'react-native-elements';
import { BorderlessButton } from 'react-native-gesture-handler';

export function HeaderButton(props) {
  const { onPress, type, name } = props;
  return (<BorderlessButton onPress={onPress} style={{ marginRight: 15 }}>
    <Icon type={type} name={name} color='#ffffff' size={Platform.OS === 'ios' ? 22 : 25} />
  </BorderlessButton>);
}

export function NavigationHeaderButton(props) {
  const { navigation, routeName, ...rest } = props;
  return (<HeaderButton {...rest} onPress={() => navigation.navigate(routeName)} />);
}
