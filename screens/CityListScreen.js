import React from 'react';
import { View, FlatList } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import sitelocations from '../constants/sitelocations';
 
export default function CityListScreen(props) {
  let {cities, showProv} = props;
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
  return (
    <FlatList style={{flex: 1}}
      data={cities}
      renderItem={({item, index}) => {
        let label = item.nameEn;
        if (showProv) {
          label += ', ';
          label += item.prov;
        }
        return (
          <SimpleListItem itemPress={() => {
            props.navigation.navigate('City', { 
              site: item,
              location: item.nameEn,
            });                        
          }}>
            {label}
          </SimpleListItem>);
        }}
      keyExtractor={item => item.site}         
    />
  );
};

CityListScreen.navigationOptions = ({ navigation }) => {
  return {
    title: navigation.getParam('title', 'Cities'),
  };
};
