import React from 'react';
import { View, Text, FlatList, TouchableHighlight } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
//import { MaterialIcons } from '@expo/vector-icons';

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
  
export default class BrowseScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Browse',
      //headerRight: (<MaterialIcons name='search' color='#fff' size={24} style={{marginRight: 5}} />),
    };
  };

  handlePress = (item) => {
    // alert('Pressed item: ' + item.name);
    this.props.navigation.navigate('CityList', { 
      province: item,
      title: item.name,
    });
  };

  render() {
    return(
      <View style={{flex: 1}}>
        <FlatList
          data={provinces}
          renderItem={({item, index}) => {
            return (<SimpleListItem itemPress={() => this.handlePress(item)}>{item.name}</SimpleListItem>);
          }}
          keyExtractor={item => item.name}         
          ItemSeparatorComponent={({highlighted}) => (
            <View style={{height: 1, backgroundColor: "#eeeeee"}} />
            )}
          ListFooterComponent={({highlighted}) => (
            <View style={{height: 1, backgroundColor: "#eeeeee"}} />
            )}
        />
      </View>
    );
  };
};
