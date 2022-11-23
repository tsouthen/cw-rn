import React from 'react';
import { View } from 'react-native';
import DraggableFlatList, { useOnCellActiveAnimation } from 'react-native-draggable-flatlist';
import { FavoritesContext } from '../components/FavoritesContext';
import { SimpleListItem } from '../components/SimpleListItem';
import HeaderBar, { HeaderBarAction } from '../components/HeaderBar';
import Colors from '../constants/Colors';
import { SettingsContext } from '../components/SettingsContext';
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";

export default function FavoritesScreen({ navigation }) {
  const { favorites, updateFavorites } = React.useContext(FavoritesContext);
  const [data, setData] = React.useState(favorites);
  const [editing, setEditing] = React.useState(false);
  const { settings } = React.useContext(SettingsContext);

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
    let newData = data.slice();
    newData.splice(index, 1);
    updateFavorites(newData);
  }

  const onSort = () => {
    let newData = data.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    updateFavorites(newData);
  }

  const getListComponent = () => {
    return (
      <DraggableFlatList
        style={{ flex: 1, backgroundColor: settings.dark ? Colors.darkBackground : Colors.lightBackground }}
        containerStyle={{ flex: 1 }}
        data={data}
        keyExtractor={item => item.site}
        onDragEnd={({ data }) => {
          updateFavorites(data);
        }}
        onDelete={onDelete}
        renderItem={({ item, getIndex, drag, isActive }) => {
          return (
            <ScaleYDecorator activeScale={1.2}>
              <SimpleListItem
                isActive={isActive}
                onPressIn={() => {
                  if (editing) {
                    drag();
                  }
                }}
                onPress={() => {
                  if (!editing) {
                    onPress(item)
                  }
                }}
                onLongPress={() => {
                  if (!editing) {
                    drag();
                  }
                }}
                editing={editing}
                onDelete={onDelete && (() => { onDelete(item, getIndex()) })}
              >
                {`${item.nameEn}, ${item.prov}`}
              </SimpleListItem>
            </ScaleYDecorator>
          );
        }}
      />);
  }

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar navigation={navigation} title="Favourites" showBackButton={false}>
        {editing && <HeaderBarAction icon="sort" onPress={onSort} />}
        <HeaderBarAction type="entypo" name="pencil" color={editing ? Colors.primaryDark : "white"} onPress={onEditPress} />
      </HeaderBar>
      {getListComponent()}
    </View>
  );
}

function ScaleYDecorator({ activeScale = 1.2, children }) {
  const { isActive, onActiveAnim } = useOnCellActiveAnimation({
    animationConfig: { mass: 0.1, restDisplacementThreshold: 0.0001 },
  });

  const style = useAnimatedStyle(() => {
    const animScale = interpolate(onActiveAnim.value, [0, 1], [1, activeScale]);
    const scale = isActive ? animScale : 1;
    return {
      transform: [{ scaleX: 1 }, { scaleY: scale }],
    };
  }, [isActive]);

  return (
    <Animated.View style={[style]}>
      {children}
    </Animated.View>
  );
}