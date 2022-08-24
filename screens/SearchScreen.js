import React from 'react';
import { Platform, View, Text, TextInput } from 'react-native';
import CityListScreen from './CityListScreen';
import { Icon } from 'react-native-elements';
import sitelocations from '../constants/sitelocations';
import Colors from '../constants/Colors';
import SearchLayout from 'react-navigation-addon-search-layout';

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

/* export default */ class NEW_SearchScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    searchText: null,
  };

  _handleQueryChange = searchText => {
    this.setState({ searchText });
  };

  _executeSearch = () => {
    alert('do search!');
  };

  render() {
    let { searchText } = this.state;

    return (
      <SearchLayout
        onChangeQuery={this._handleQueryChange}
        onSubmit={this._executeSearch}>
        {searchText ? (<Text>{'Searching for: ' + searchText}</Text>) : (<Text>Search results appear here</Text>)}
      </SearchLayout>
    );
  }
}

export default class SearchScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: 'Search',
      headerTitle: (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TextInput 
            style={{flex:1, color: 'white', fontFamily: 'montserrat', fontSize: 16}}
            placeholderStyle={{color: 'white', fontFamily: 'montserrat', fontSize: 16}}
            placeholderTextColor='white'
            placeholder='Search cities    ' 
            autoFocus={true} 
            selectionColor={Colors.primaryDark}
            returnKeyType='search'
            onChangeText={navigation.getParam('searchAction')}
            ref={input => {
              this.input = input;
              this.navigation = navigation;
            }}            
          />
          <Icon type='material' name='clear' color='#ffffff' underlayColor={Colors.primary} size={25} 
            iconStyle={{marginRight: 10}} 
            onPress={() => {
              this.input.clear();
              if (!this.input.isFocused())
                this.input.focus();
              
                //update the search results
              let searchAction = this.navigation.getParam('searchAction');
              if (searchAction)
                searchAction('');
            }} 
          />
        </View>
      ),
    };
  };

  constructor(props) {
    super(props);
    this.state = { 
      search: '',
      cities: [],
      };
  };

  componentDidMount() {
    this.props.navigation.setParams({
      searchAction : this.updateSearch,
    });
  };

  removeAccents = (input) => {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  updateSearch = (search) => {
    let cities = [];
    if (search.length > 0) {
      let searchVal = this.removeAccents(search);
      cities = sitelocations.filter((entry) => this.removeAccents(entry.nameEn).startsWith(searchVal));
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
    // else if ((this.state.cities.length === 0) && (search.length === 1))
    //   message = 'Enter at least one more character.';
    else if ((this.state.cities.length === 0) && (search.length === 0))
      message = 'Results appear here as you type.';

    if (message && message.length)
      component = (<Text style={{ padding: 10, fontFamily:'montserrat', fontSize: 18}}>{message}</Text>);
    else
      component = (<CityListScreen showProv='true' cities={this.state.cities} {...this.props} />);

    return (
      <View style={{flex: 1, flexDirection: "column"}}>
        {component}        
      </View>
    );
  }
};
