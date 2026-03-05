// color design tokens export
export const tokensDark = {
  grey: {
    0: "#ffffff",
    10: "#f8fafc",
    50: "#f1f5f9",
    100: "#e2e8f0",
    200: "#cbd5e1",
    300: "#94a3b8",
    400: "#64748b",
    500: "#475569",
    600: "#334155",
    700: "#1e293b",
    800: "#0f172a", // Dark Mode Alt Background (cards/sidebar)
    900: "#020617", // Dark Mode Default Background
    1000: "#000000",
  },
  primary: {
    // Professional Royal Blue / Indigo
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8", // primary main (dark mode)
    500: "#6366f1", // primary main (light mode)
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  secondary: {
    // Electric Teal for striking accents
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4", // secondary main (dark mode checks/buttons)
    400: "#2dd4bf",
    500: "#14b8a6", // secondary main (light mode)
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
  },
};

// function that reverses the color palette
function reverseTokens(tokensDark) {
  const reversedTokens = {};
  Object.entries(tokensDark).forEach(([key, val]) => {
    const keys = Object.keys(val);
    const values = Object.values(val);
    const length = keys.length;
    const reversedObj = {};
    for (let i = 0; i < length; i++) {
      reversedObj[keys[i]] = values[length - i - 1];
    }
    reversedTokens[key] = reversedObj;
  });
  return reversedTokens;
}
export const tokensLight = reverseTokens(tokensDark);

// mui theme settings
export const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
          // palette values for dark mode
          primary: {
            ...tokensDark.primary,
            main: tokensDark.primary[400],
            light: tokensDark.primary[300],
            dark: tokensDark.primary[600],
          },
          secondary: {
            ...tokensDark.secondary,
            main: tokensDark.secondary[300],
            light: tokensDark.secondary[200],
            dark: tokensDark.secondary[500],
          },
          neutral: {
            ...tokensDark.grey,
            main: tokensDark.grey[300],
          },
          background: {
            default: tokensDark.grey[900],
            alt: tokensDark.grey[800],
          },
        }
        : {
          // palette values for light mode
          primary: {
            ...tokensLight.primary,
            main: tokensDark.primary[500],
            light: tokensDark.primary[400],
            dark: tokensDark.primary[700],
          },
          secondary: {
            ...tokensLight.secondary,
            main: tokensDark.secondary[500],
            light: tokensDark.secondary[400],
            dark: tokensDark.secondary[700],
          },
          neutral: {
            ...tokensLight.grey,
            main: tokensDark.grey[600],
          },
          background: {
            default: tokensDark.grey[10],
            alt: tokensDark.grey[0],
          },
        }),
    },
    typography: {
      fontFamily: ["Inter", "sans-serif"].join(","),
      fontSize: 13,
      h1: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 36,
        fontWeight: 700,
      },
      h2: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 28,
        fontWeight: 600,
      },
      h3: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 22,
        fontWeight: 600,
      },
      h4: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 18,
        fontWeight: 600,
      },
      h5: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 16,
        fontWeight: 500,
      },
      h6: {
        fontFamily: ["Inter", "sans-serif"].join(","),
        fontSize: 14,
        fontWeight: 500,
      },
    },
  };
};
