import React from 'react';

const settings = {
    night: false,
    round: true,
    updateSettings: () => {},
};

export const SettingsContext = React.createContext(settings);
