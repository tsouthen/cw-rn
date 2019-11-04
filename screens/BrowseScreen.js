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
  
export default class BrowseScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Browse',
      headerRight: (<NavigationHeaderButton type='material' name='search' navigation={navigation} routeName='Search' />),
    };
  };

  componentDidMount() {
    this.props.navigation.setParams({
      searchAction : this.handleSearch, 
    });
  };

  handlePress = (item) => {
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
            return (<SimpleListItem onPress={() => this.handlePress(item)}>{item.name}</SimpleListItem>);
          }}
          keyExtractor={item => item.name}         
        />
      </View>
    );
  };
};
