import React from 'react';
import { Appbar } from 'react-native-paper';

export default function HeaderBar({ title, subtitle, navigation, showBackButton, buttons, ...rest }) {
  return (
    <Appbar.Header>
      {navigation && showBackButton && <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />}
      {title && <Appbar.Content title={title} titleStyle={{ fontFamily: 'montserrat' }} subtitle={subtitle} color='white' />}
      {rest.children}
    </Appbar.Header>
  );
}

export function HeaderBarAction({ color, ...props }) {
  return (
    <Appbar.Action color={color || "white"} {...props} />
  );
}
export function HeaderBarNavigationAction({ navigation, screen, ...rest }) {
  return (
    <HeaderBarAction {...rest} onPress={() => navigation.push(screen)} />
  );
}
