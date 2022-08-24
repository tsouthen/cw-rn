import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import CityListScreen from './CityListScreen';
import { SearchBar } from 'react-native-elements';
import sitelocations from '../constants/sitelocations';

export default class SearchScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Search',
    };
  };

  constructor(props) {
    super(props);
    this.state = { 
      search: '',
      cities: [],
      };
  };

  removeAccents = (input) => {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  updateSearch = (search) => {
    let cities = [];
    if (search.length > 1) {
      let searchVal = this.removeAccents(search);
      cities = sitelocations.filter((entry) => this.removeAccents(entry.nameEn).includes(searchVal));
      cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
    }
    this.setState({
      search: search, 
      cities: cities
    });
  };

  render() {
    const { search } = this.state;
    return (
      //lightTheme={true} inputStyle={styles.inputStyle} inputContainerStyle={styles.inputStyle} 
      <View style={{flex: 1, flexDirection: "column"}}>
        <SearchBar placeholder='Type city name here' onChangeText={this.updateSearch} value={search} platform={Platform.OS} />
        <CityListScreen showProv='true' cities={this.state.cities} {...this.props} />
      </View>
    );
  }
};
