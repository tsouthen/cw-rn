import React from 'react';
import { View, FlatList } from 'react-native';
import { SimpleListItem } from '../components/SimpleListItem';
import sitelocations from '../constants/sitelocations';
 
export default class CityListScreen extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('title', 'Cities'),
    };
  };

  constructor(props) {
    super(props);
    const { navigation } = this.props;
    let search = navigation.getParam('search');
    const province = navigation.getParam('province');
    if (search) {
      search = search.toLowercase();
      this.cities = sitelocations.filter((entry) => entry.name.toLowercase().includes(search));
    } else if (province) {
        this.cities = sitelocations.filter((entry) => entry.prov === province.abbr);
    } else {
      this.cities = props.cities;
      if (this.cities === undefined)
        this.cities = [];
    }
    this.cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
    //TODO: put this.cities in this.state.data
  }

  handlePress = (item) => {
    this.props.navigation.navigate('City', { 
      site: item,
      location: item.nameEn,
    });
  };

  render() {
    return(
      <FlatList style={{flex: 1}}
        data={this.cities}
        renderItem={({item, index}) => {
          return (<SimpleListItem itemPress={() => this.handlePress(item)}>{item.nameEn}</SimpleListItem>);
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
};
