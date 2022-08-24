import React from 'react';

const favorites = {
    favorites: [],
    updateFavorites: () => {},
};

export const FavoritesContext = React.createContext(favorites);
