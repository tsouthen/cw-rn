import React from 'react';
import { FlatList, View } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import sitelocations from '../constants/sitelocations';
import HeaderBar from '../components/HeaderBar';
import { SettingsContext } from '../components/SettingsContext';
import Colors from '../constants/Colors';

export default function CityListScreen(props) {
  const { settings } = React.useContext(SettingsContext);
  let { cities, showProv, title, ...rest } = props;
  const { navigation, route, onDelete, ...remainingProps } = rest;
  const prov = route?.params?.province;

  if (prov) {
    showProv = false;
    cities = sitelocations.filter((entry) => entry.prov === prov.abbr);
    cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
  } else if (!cities) {
    cities = route?.params?.cities;
  }

  const commonProps = {
    style: { flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground },
    data: cities,
    keyExtractor: item => item.site,
    bounces: false,
  }

  const getLabel = (item) => {
    let label = item.nameEn;
    if (showProv) {
      label += ', ';
      label += item.prov;
    }
    return label;
  }

  const onPress = (item) => {
    navigation.navigate('City', {
      site: item,
      location: item.nameEn,
    });
  }

  const getListComponent = () => {
    return (
      <FlatList
        {...commonProps}
        {...remainingProps}
        renderItem={({ item }) => {
          return (
            <SimpleListItem onPress={() => onPress(item)}>
              {getLabel(item)}
            </SimpleListItem>);
        }}
      />);
  }

  title = title ?? prov?.name;
  return (
    <View style={{ flex: 1 }}>
      {title && <HeaderBar navigation={navigation} title={title} showBackButton={!!prov} />}
      {getListComponent()}
    </View>
  );
};
