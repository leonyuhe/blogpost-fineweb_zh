// export const COLORS = [
//     [255, 135, 65], // Bright Orange
//     [96, 168, 176], // Ocean Blue
//     [23, 17, 26], // Charcoal Black
//     [141, 193, 86], // Fresh Green
//     [208, 65, 83], // Soft Red
//     [73, 85, 136], // Deep Blue
//     [45, 68, 67], // Dark Forest Green
//     [255, 206, 149], // Peach
//     [241, 139, 105], // Salmon Pink
//     [102, 45, 57], // Burgundy
//     [174, 91, 57], // Brown
//     [232, 158, 86], // Sand
//     [255, 220, 106], // Sun Yellow
//     [213, 246, 110], // Light Lime
//     [74, 122, 71], // Moss Green
//     [110, 81, 106], // Muted Purple
//     [170, 140, 148], // Dusty Rose
//     [223, 203, 191], // Soft Beige
//     [255, 255, 255], // Pure White
//     [255, 153, 169], // Light Pink
//     [199, 102, 178], // Vivid Purple
//     [131, 58, 149], // Deep Purple
//     [59, 44, 74], // Dark Slate
//     [154, 231, 201], // Aqua Green
// ]

export const COLORS = [
    ["235", "102", "59"], // Burnt Orange
    ["46", "145", "229"], // Sky Blue
    ["225", "95", "153"], // Soft Magenta
    ["28", "167", "28"], // Bright Green
    // ["108", "69", "22"], // Dark Brown
    ["167", "119", "241"], // Lavender
    ["182", "129", "0"], // Mustard Yellow
    ["134", "42", "22"], // Brick Red
    ["0", "160", "139"], // Teal
    ["175", "0", "56"], // Crimson
    ["108", "124", "50"], // Olive Green
    ["81", "28", "251"], // Royal Blue
    ["218", "22", "255"], // Electric Purple
    ["98", "0", "66"], // Dark Magenta
    // ['34', '42', '42'], Black, which makes the text unreadable
    // ["117", "13", "134"], // Deep Magenta
    ["251", "0", "209"], // Hot Pink
    ["252", "0", "128"], // Bright Pink
    // ["178", "130", "141"], // Dusty Pink
    ["119", "138", "174"], // Slate Blue
    ["22", "22", "167"], // Deep Blue
    ["218", "96", "202"], // Orchid
    // ['13', '42', '99'], Black
];




export const NAMED_COLORS = {
    "red": ["251", "13", "13"], // Vivid Red
    "black": ['13', '42', '99'], // Black
    "blue": ["46", "145", "229"], // Sky Blue
};

export const getColor = (i, opacity=1) => {
    if (i < 0) {
        i = i * -1;
    }
    return `rgba(${COLORS[i % COLORS.length].join(",")}, ${opacity})`;
};

export const getNamedColor = (name, opacity=1) => {
    if (NAMED_COLORS.hasOwnProperty(name)) {
        return `rgba(${NAMED_COLORS[name].join(",")}, ${opacity})`;
    } else {
        return undefined; // Return undefined if name doesn't exist
    }
};

