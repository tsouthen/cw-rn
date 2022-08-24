import React from 'react';
import { FlatList, View } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import sitelocations from '../constants/sitelocations';
import DraggableFlatList from 'react-native-draggable-dynamic-flatlist';
import HeaderBar from '../components/HeaderBar';

export default function CityListScreen(props) {
  let { cities, showProv, title, ...rest } = props;
  const { draggable, navigation, route, ...remainingProps } = rest;
  const prov = route?.params?.province;

  if (prov) {
    showProv = false;
    cities = sitelocations.filter((entry) => entry.prov === prov.abbr);
    cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
  } else if (!cities) {
    cities = route?.params?.cities;
  }

  let commonProps = {
    style: { flex: 1, backgroundColor: 'white' },
    data: cities,
    keyExtractor: item => item.site,
  }
  let getLabel = (item) => {
    let label = item.nameEn;
    if (showProv) {
      label += ', ';
      label += item.prov;
    }
    return label;
  }
  let onPress = (item) => {
    navigation.navigate('City', {
      site: item,
      location: item.nameEn,
    });
  }
  const getListComponent = () => {
    if (draggable && cities)
      return (
        <DraggableFlatList
          {...commonProps}
          {...remainingProps}
          renderItem={({ item, index, move, moveEnd, isActive }) => {
            return (
              <SimpleListItem isActive={isActive} onPress={() => onPress(item)} onLongPress={move} onPressOut={moveEnd} >
                {getLabel(item)}
              </SimpleListItem>);
          }}
        />);
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
