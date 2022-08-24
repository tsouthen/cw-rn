import React from 'react';
import { View, FlatList } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import { Icon } from 'react-native-elements';
import Colors from '../constants/Colors';

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
    let search = (<Icon type='material' name='search' color='#ffffff' underlayColor={Colors.primary} size={24} iconStyle={{marginRight: 10}} onPress={navigation.getParam('searchAction')} />);
    return {
      title: 'Browse',
      headerRight: (
        <View style={{flexDirection:'row'}}>
          {search}
        </View>),
    };
  };

  componentDidMount() {
    this.props.navigation.setParams({
      searchAction : this.handleSearch, 
    });
  };

  handleSearch = () => {
    this.props.navigation.navigate('Search', { 
      title: 'Search',
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
