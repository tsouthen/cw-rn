import React from 'react';
import { Platform, View, Text } from 'react-native';
import CityListScreen from './CityListScreen';
import { SearchBar } from 'react-native-elements';
import sitelocations from '../constants/sitelocations';

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

export default class SearchScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Search',
      header: null,
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
    let message = '';
    let component = null;
    if ((this.state.cities.length === 0) && (search.length > 1))
      message = 'No cities found.';
    else if ((this.state.cities.length === 0) && (search.length === 1))
      message = 'Enter at least one more character.';
    else if ((this.state.cities.length === 0) && (search.length === 0))
      message = 'Click on "Search" above to start searching.';

    if (message && message.length)
      component = (<Text style={{ padding: 10, fontFamily:'montserrat'}}>{message}</Text>);
    else
      component = (<CityListScreen showProv='true' cities={this.state.cities} {...this.props} />);

    return (
      <View style={{flex: 1, flexDirection: "column"}}>
        <SearchBar placeholder='Search' placeholderTextColor='white'
          onChangeText={this.updateSearch} value={search} platform={Platform.OS} 
          containerStyle={{backgroundColor: '#FF8800', elevation: 3 }} 
          returnKeyLabel='search'
          selectionColor='#c55900'
          inputStyle={{ color: 'white', fontFamily: 'montserrat', fontSize:20 }} 
          cancelIcon={{ color: 'white', underlayColor: '#FF8800'}} 
          clearIcon={{ color: 'white', underlayColor: '#FF8800'}} 
          searchIcon={{ color: 'white', underlayColor: '#FF8800'}} 
          />
        {component}        
      </View>
    );
  }
};
