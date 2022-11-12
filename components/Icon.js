import { Entypo, Feather, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

export function Icon(props) {
    const { type, size = 24, color = 'white', name, ...theRest } = props;
    switch (type) {
        case "entypo":
            return <Entypo {...{ size, color, name }} {...theRest} />;
        case "feather":
            return <Feather {...{ size, color, name }}  {...theRest} />;
        case "font-awesome":
            return <FontAwesome {...{ size, color, name }}  {...theRest} />;
        case "ionicon":
            return <Ionicons {...{ size, color, name }}  {...theRest} />;
        case "material":
            return <MaterialIcons {...{ size, color, name }}  {...theRest} />;
        case "material-community":
            return <MaterialCommunityIcons {...{ size, color, name }}  {...theRest} />;
    }
}