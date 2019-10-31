import React from 'react';

const settings = {
    night: false,
    round: true,
    update: () => {},
};

export const SettingsContext = React.createContext(settings);
