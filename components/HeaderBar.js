import React from 'react';
import { Appbar } from 'react-native-paper';
import { Icon } from 'react-native-elements';

export default function HeaderBar({ title, subtitle, navigation, showBackButton, buttons, ...rest }) {
  return (
    <Appbar.Header dark={true}>
      {navigation && showBackButton && <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />}
      {title && <Appbar.Content title={title} titleStyle={{ fontFamily: 'montserrat' }} subtitle={subtitle} color='white' />}
      {rest.children}
    </Appbar.Header>
  );
}

export function HeaderBarAction({ color, type, name, ...props }) {
  let iconProps = {};
  if (!props.icon && type && name) {
    iconProps = {
      icon: (props) => <Icon type={type} name={name} color={props.color || "white"} />
    }
  }
  return (
    <Appbar.Action color={color || "white"} {...iconProps} {...props} />
  );
}
export function HeaderBarNavigationAction({ navigation, screen, ...rest }) {
  return (
    <HeaderBarAction {...rest} onPress={() => navigation.push(screen)} />
  );
}
