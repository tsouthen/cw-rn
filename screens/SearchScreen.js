import React from 'react';
import { View, Text, TextInput } from 'react-native';
import CityListScreen from './CityListScreen';
import { Icon } from 'react-native-elements';
import sitelocations from '../constants/sitelocations';
import Colors from '../constants/Colors';

export default function SearchScreen(props) {
  const navigation = props.navigation;
  const [search, setSearch] = React.useState("");
  const [cities, setCities] = React.useState([]);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{ flex: 1, color: 'white', fontFamily: 'montserrat', fontSize: 16 }}
            placeholderStyle={{ color: 'white', fontFamily: 'montserrat', fontSize: 16 }}
            placeholderTextColor='white'
            placeholder='Search cities    '
            autoFocus={true}
            selectionColor={Colors.primaryDark}
            returnKeyType='search'
            onChangeText={updateSearch}
            ref={input => {
              this.input = input;
            }}
          />
          <Icon type='material' name='clear' color='#ffffff' underlayColor={Colors.primary} size={25}
            iconStyle={{ marginRight: 10 }}
            onPress={() => {
              this.input.clear();
              if (!this.input.isFocused())
                this.input.focus();

              updateSearch("");
            }}
          />
        </View>
      ),
    });
  }, [navigation]);

  removeAccents = (input) => {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  updateSearch = (search) => {
    let cities = [];
    if (search.length > 0) {
      let searchVal = removeAccents(search);
      cities = sitelocations.filter((entry) => removeAccents(entry.nameEn).startsWith(searchVal));
      cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
    }
    setSearch(search);
    setCities(cities);
  };

  let message = '';
  let component = null;
  if ((cities.length === 0) && (search.length > 1))
    message = 'No cities found.';
  // else if ((cities.length === 0) && (search.length === 1))
  //   message = 'Enter at least one more character.';
  else if ((cities.length === 0) && (search.length === 0))
    message = 'Results appear here as you type.';

  if (message && message.length)
    component = (<Text style={{ padding: 10, fontFamily: 'montserrat', fontSize: 18 }}>{message}</Text>);
  else
    component = (<CityListScreen showProv='true' cities={cities} {...props} />);

  return (
    <View style={{ flex: 1, flexDirection: "column" }}>
      {component}
    </View>
  );
};
