export const DecorationTypes = {
    URBAN: {
        BENCH: {
            type: 'bench',
            collision: true,
            variants: ['standard', 'modern'],
        },
        PLANTER: {
            type: 'planter',
            collision: true,
            variants: ['small', 'large'],
        },
        CAMERA: {
            type: 'camera',
            collision: false,
            variants: ['dome', 'pole'],
        },
        TERMINAL: {
            type: 'terminal',
            collision: true,
            variants: ['standard'],
        },
    },
    NATURAL: {
        BUSH: {
            type: 'bush',
            collision: true,
            variants: ['small', 'large'],
        },
        FLOWER: {
            type: 'flower',
            collision: false,
            variants: ['red', 'yellow'],
        },
    },
};

export const DecorationProperties = {
    interactive: false,
    durability: 100,
    lightSource: false,
    lightIntensity: 0,
};

