import React from 'react';
import { View, Text, TextInput } from 'react-native';
import CityListScreen from './CityListScreen';
import sitelocations from '../constants/sitelocations';
import Colors from '../constants/Colors';
import HeaderBar, { HeaderBarAction } from '../components/HeaderBar';

export default function SearchScreen(props) {
  const navigation = props.navigation;
  const [search, setSearch] = React.useState("");
  const [cities, setCities] = React.useState([]);
  const textInput = React.useRef(null);

  const onChangeText = (search) => {
    let cities = [];
    if (search.length > 0) {
      let searchVal = removeAccents(search);
      cities = sitelocations.filter((entry) => removeAccents(entry.nameEn).startsWith(searchVal));
      cities.sort((a, b) => a.nameEn < b.nameEn ? -1 : (a.nameEn > b.nameEn ? 1 : 0));
    }
    setSearch(search);
    setCities(cities);
  };

  const onPress = () => {
    if (!textInput.current)
      return;

    textInput.current.clear();
    if (!textInput.current.isFocused())
      textInput.current.focus();

    onChangeText("");
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
    <View style={{ flex: 1 }}>
      <HeaderBar showBackButton={true} navigation={navigation} >
        <TextInput
          style={{
            flex: 1,
            color: 'white',
            fontFamily: 'montserrat',
            fontSize: 18,
            paddingLeft: 8,
            alignSelf: 'stretch',
            minWidth: 0,
          }}
          placeholderStyle={{ color: 'white', fontFamily: 'montserrat' }}
          placeholderTextColor='white'
          placeholder='Search cities'
          autoFocus={true}
          selectionColor={Colors.primaryDark}
          returnKeyType='search'
          onChangeText={onChangeText}
          ref={textInput}
        />
        <HeaderBarAction icon="close" onPress={onPress} disabled={!search} />
      </HeaderBar>
      <View style={{ flex: 1, flexDirection: "column" }}>
        {component}
      </View>
    </View>
  );
};

function removeAccents(input) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

