import React from 'react';
import { View, FlatList } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import { NavigationHeaderButton } from '../components/HeaderButton';

const provinces = [
  { name: 'Alberta', abbr: 'AB' },
  { name: 'British Columbia', abbr: 'BC' },
  { name: 'Manitoba', abbr: 'MB' },
  { name: 'New Brunswick', abbr: 'NB' },
  { name: 'Newfoundland and Labrador', abbr: 'NL' },
  { name: 'Northwest Territories', abbr: 'NT' },
  { name: 'Nova Scotia', abbr: 'NS' },
  { name: 'Nunavut', abbr: 'NU' },
  { name: 'Ontario', abbr: 'ON' },
  { name: 'Prince Edward Island', abbr: 'PE' },
  { name: 'Quebec', abbr: 'QC' },
  { name: 'Saskatchewan', abbr: 'SK' },
  { name: 'Yukon', abbr: 'YT' },
];

export default function BrowseScreen({ navigation }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <NavigationHeaderButton type='material' name='search' navigation={navigation} routeName='Search' />
    });
  }, [navigation]);

  handlePress = (item) => {
    navigation.navigate('CityList', {
      province: item,
      title: item.name,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={provinces}
        renderItem={({ item }) => {
          return (<SimpleListItem onPress={() => handlePress(item)}>{item.name}</SimpleListItem>);
        }}
        keyExtractor={item => item.name}
      />
    </View>
  );
}
