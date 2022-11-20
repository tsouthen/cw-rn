import React from 'react';
import Colors from '../constants/Colors';
import { Linking, View } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { HeaderBarAction } from '../components/HeaderBar';
import { SettingsContext } from '../components/SettingsContext';
import WebView from 'react-native-webview';

export default function WarningScreen(props) {
  const { navigation, route } = props;
  const url = route?.params?.url;
  const suffix = url.substring(url.lastIndexOf("?"));
  const { settings } = React.useContext(SettingsContext);
  const webview = React.useRef();
  const [currUrl, setCurrUrl] = React.useState(url);

  const onNavigationStateChange = (newNavState) => {
    const newUrl = newNavState.url.replace("#wb-cont", "");
    if (!newUrl.endsWith(suffix) && !newUrl.endsWith("lang.php")) {
      webview.current?.stopLoading();
      console.log(`Blocked url: ${newNavState.url}`);
    } else {
      setCurrUrl(newNavState.url);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}>
      <HeaderBar title="Weather Alerts" navigation={navigation} showBackButton={true}>
        <HeaderBarAction type="ionicon" name="reload" color="white" onPress={() => webview.current?.reload()} />
        <HeaderBarAction type="ionicon" name="open-outline" color="white" onPress={() => {
          Linking.openURL(currUrl);
          navigation.goBack();
        }} />
      </HeaderBar>
      <WebView ref={webview} source={{ url: url + "#wb-cont" }} pullToRefreshEnabled={true} onNavigationStateChange={onNavigationStateChange} />
    </View>
  );
}