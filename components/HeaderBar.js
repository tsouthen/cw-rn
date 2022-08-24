import React from 'react';
import { Appbar } from 'react-native-paper';

export default function HeaderBar({ title, navigation, showBackButton, buttons, ...rest }) {
  return (
    <Appbar.Header>
      {navigation && showBackButton && <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />}
      {title && <Appbar.Content title={title} titleStyle={{ fontFamily: 'montserrat' }} color='white' />}
      {rest.children}
    </Appbar.Header>
  );
}

export function HeaderBarAction(props) {
  return (
    <Appbar.Action color="white" {...props} />
  );
}
export function HeaderBarNavigationAction({ navigation, screen, ...rest }) {
  return (
    <HeaderBarAction {...rest} onPress={() => navigation.push(screen)} />
  );
}
