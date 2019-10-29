import React from 'react';
import { View, FlatList } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import sitelocations from '../constants/sitelocations';
import DraggableFlatList from 'react-native-draggable-dynamic-flatlist';
 
export default function CityListScreen(props) {
  const {cities, showProv, draggable, ...remainingProps} = props;
  if (props.navigation) {
    let prov = props.navigation.getParam('province');
    if (prov) {
      showProv = false;
      cities = sitelocations.filter((entry) => entry.prov === prov.abbr);
      cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
    } else if (!cities) {
      cities = props.navigation.getParam('cities');
    }
  }
  let commonProps = {
    style: { flex: 1},
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
    props.navigation.navigate('City', { 
      site: item,
      location: item.nameEn,
    });
  }
  if (draggable)
    return (
      <DraggableFlatList 
        {...commonProps}
        {...remainingProps}
        onMoveEnd={({ data }) => props.data = data}
        renderItem={({item, index, move, moveEnd, isActive }) => {
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
      renderItem={({item}) => {
        return (
          <SimpleListItem onPress={() => onPress(item)}>
            {getLabel(item)}
          </SimpleListItem>);
        }}
    />);
};

CityListScreen.navigationOptions = ({ navigation }) => {
  return {
    title: navigation.getParam('title', 'Cities'),
  };
};
