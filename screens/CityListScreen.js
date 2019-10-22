import React from 'react';
import { View, FlatList } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import sitelocations from '../constants/sitelocations';
 
export default function CityListScreen(props) {
  return (
    <FlatList style={{flex: 1}}
      data={props.cities}
      renderItem={({item, index}) => {
        let label = item.nameEn;
        if (props.showProv) {
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
      ItemSeparatorComponent={({highlighted}) => (
        <View style={{height: 1, backgroundColor: "#eeeeee"}} />
        )}
      ListFooterComponent={({highlighted}) => (
        <View style={{height: 1, backgroundColor: "#eeeeee"}} />
        )}
    />
  );
};

CityListScreen.navigationOptions = ({ navigation }) => {
  return {
    title: navigation.getParam('title', 'Cities'),
  };
};

export function ProvinceCityListScreen(props) {
  return (
    <CityListScreen {...props} showProv={false} cities={ 
      sitelocations.filter((entry) => entry.prov === props.navigation.getParam('province', {abbr:'BC', name:'British Columnbia'}).abbr)
        .sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0))} />
  );
};

ProvinceCityListScreen.navigationOptions = ({ navigation }) => {
  return {
    title: navigation.getParam('title', 'Province'),
  };
};
