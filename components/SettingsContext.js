import React from 'react';

const settings = {
    settings: {
        night: false,
        round: true,
    },
    updateSetting: (prop, value) => { },
};

export const SettingsContext = React.createContext(settings);
