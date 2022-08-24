import React from 'react';

const favorites = {
    favorites: [],
    updateFavorites: (favorites) => { },
};

export const FavoritesContext = React.createContext(favorites);
