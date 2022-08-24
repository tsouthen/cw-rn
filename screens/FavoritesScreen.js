import React from 'react';
import CityListScreen from './CityListScreen';
import { FavoritesContext } from '../components/FavoritesContext';

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

export default function FavoritesScreen(props) {
  const { favorites, updateFavorites } = React.useContext(FavoritesContext);

  return (
    <CityListScreen
      title="Favourites"
      cities={favorites}
      showProv='true'
      draggable={true}
      onMoveEnd={({ data }) => updateFavorites(data)}
      {...props} />
  );
}
