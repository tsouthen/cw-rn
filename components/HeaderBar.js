import React from 'react';
import { Appbar } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { SettingsContext } from '../components/SettingsContext';
import { ShareContext } from '../components/ShareContext';

export default function HeaderBar({ title, subtitle, navigation, showBackButton, buttons, ...rest }) {
  const { settings } = React.useContext(SettingsContext);
  return (
    <Appbar.Header dark={!settings.dark}>
      {navigation && showBackButton && <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />}
      {title && <Appbar.Content title={title} titleStyle={{ fontFamily: 'montserrat' }} subtitle={subtitle} color="white" />}
      {rest.children}
    </Appbar.Header>
  );
}

export function HeaderBarAction({ color, type, name, ...props }) {
  const { settings } = React.useContext(SettingsContext);
  let iconProps = {};
  if (!props.icon && type && name) {
    iconProps = {
      icon: (props) => <Icon type={type} name={name} color={props.color || "white"} />
    }
  }
  return (
    <Appbar.Action animated={false} color={color || "white"} {...iconProps} {...props} />
  );
}

export function HeaderBarNavigationAction({ navigation, screen, ...rest }) {
  return (
    <HeaderBarAction {...rest} onPress={() => navigation.push(screen)} />
  );
}

export function HeaderBarShareAction() {
  const { onShare } = React.useContext(ShareContext);
  return <HeaderBarAction type="feather" name={Platform.OS === "ios" ? "share" : "share-2"} onPress={onShare} />;

}