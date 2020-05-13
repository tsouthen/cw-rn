import React from 'react';

const settings = {
    settings: {
        night: false,
        round: true,
        dark: false,
    },
    updateSetting: (prop, value) => { },
};

export const SettingsContext = React.createContext(settings);
