import React from 'react';
import { View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-dynamic-flatlist';
import { FavoritesContext } from '../components/FavoritesContext';
import { SimpleListItem } from '../components/SimpleListItem';
import HeaderBar, { HeaderBarAction } from '../components/HeaderBar';
import Colors from '../constants/Colors';

export const defaultFavorites = [
  {
    site: "s0000047",
    nameEn: "Calgary",
    nameFr: "Calgary",
    prov: "AB",
    latitude: 51.05,
    longitude: -114.06
  },
  {
    site: "s0000583",
    nameEn: "Charlottetown",
    nameFr: "Charlottetown",
    prov: "PE",
    latitude: 46.24,
    longitude: -63.13
  },
  {
    site: "s0000318",
    nameEn: "Halifax",
    nameFr: "Halifax",
    prov: "NS",
    latitude: 44.87,
    longitude: -63.72
  },
  {
    site: "s0000394",
    nameEn: "Iqaluit",
    nameFr: "Iqaluit",
    prov: "NU",
    latitude: 63.75,
    longitude: -68.52
  },
  {
    site: "s0000654",
    nameEn: "Moncton",
    nameFr: "Moncton",
    prov: "NB",
    latitude: 46.12,
    longitude: -64.8
  },
  {
    site: "s0000635",
    nameEn: "Montréal",
    nameFr: "Montréal",
    prov: "QC",
    latitude: 45.52,
    longitude: -73.65
  },
  {
    site: "s0000797",
    nameEn: "Saskatoon",
    nameFr: "Saskatoon",
    prov: "SK",
    latitude: 52.14,
    longitude: -106.69
  },
  {
    site: "s0000280",
    nameEn: "St. John's",
    nameFr: "St. John's",
    prov: "NL",
    latitude: 47.57,
    longitude: -52.73
  },
  {
    site: "s0000458",
    nameEn: "Toronto",
    nameFr: "Toronto",
    prov: "ON",
    latitude: 43.74,
    longitude: -79.37
  },
  {
    site: "s0000141",
    nameEn: "Vancouver",
    nameFr: "Vancouver",
    prov: "BC",
    latitude: 49.25,
    longitude: -123.12
  },
  {
    site: "s0000825",
    nameEn: "Whitehorse",
    nameFr: "Whitehorse",
    prov: "YT",
    latitude: 60.7,
    longitude: -135.08
  },
  {
    site: "s0000193",
    nameEn: "Winnipeg",
    nameFr: "Winnipeg",
    prov: "MB",
    latitude: 49.88,
    longitude: -97.15
  },
  {
    site: "s0000366",
    nameEn: "Yellowknife",
    nameFr: "Yellowknife",
    prov: "NT",
    latitude: 62.46,
    longitude: -114.35
  },
];

export default function FavoritesScreen({ navigation }) {
  const { favorites, updateFavorites } = React.useContext(FavoritesContext);
  const [data, setData] = React.useState(favorites);
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    setData(favorites);
  }, [favorites]);

  const onPress = (item) => {
    navigation.navigate('City', {
      site: item,
      location: item.nameEn,
    });
  }

  const onEditPress = () => {
    setEditing(!editing);
  }

  const onDelete = (item, index) => {
    console.log(`Deleting ${item.nameEn}`);
    console.log("favorite count: " + data.length);
    let newData = data.slice();
    newData.splice(index, 1);
    console.log("favorite count: " + newData.length);
    updateFavorites(newData);
    setData(newData);
  }

  const getListComponent = () => {
    return (
      <DraggableFlatList
        style={{ flex: 1, backgroundColor: 'white' }}
        data={data}
        keyExtractor={item => item.site}
        bounces={false}
        onMoveEnd={({ data }) => updateFavorites(data)}
        onDelete={onDelete}
        renderItem={({ item, index, move, moveEnd, isActive }) => {
          return (
            <SimpleListItem
              isActive={isActive}
              // onPressIn={() => {
              //   if (editing) {
              //     move();
              //   }
              // }}
              onPress={() => {
                if (!editing) {
                  onPress(item)
                }
              }}
              onLongPress={() => {
                if (editing) {
                  move();
                }
              }}
              onPressOut={() => {
                moveEnd();
              }}
              editing={editing}
              onDelete={onDelete && (() => { onDelete(item, index) })}
            >
              {`${item.nameEn}, ${item.prov}`}
            </SimpleListItem>);
        }}
      />);
  }

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar navigation={navigation} title="Favourites" showBackButton={false}>
        {/* <HeaderBarAction icon="sort" /> */}
        <HeaderBarAction icon="pencil" color={editing ? Colors.primaryDark : 'white'} onPress={onEditPress} />
      </HeaderBar>
      {getListComponent()}
    </View>
  );
}
