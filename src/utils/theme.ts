/* eslint-disable react-hooks/rules-of-hooks */

// export const theme = createTheme({
//   palette: {
//     mode: "dark", //set the default theme mode to dark
//     primary: {
//       main: "rgb(255,122,0)", //add in a custom color for the toolbar
//     },
//     info: {
//       main: "rgb(255,122,0)", //add in a custom color for the toolbar alert background stuff
//     },
//     background: {
//       default: "#000", //pure black table in dark mode for fun
//     },
//   },
//   typography: {
//     button: {
//       textTransform: "none", //customize typography styles for all buttons in table by default
//       fontSize: "1.2rem",
//     },
//   },
//   components: {
//     MuiTooltip: {
//       styleOverrides: {
//         tooltip: {
//           fontSize: "1.1rem", //override to make tooltip font size larger
//         },
//       },
//     },
//     MuiSwitch: {
//       styleOverrides: {
//         thumb: {
//           color: "pink", //change the color of the switch thumb in the columns show/hide menu to pink
//         },
//       },
//     },
//   },
// });

export const theme = {
  palette: {
    mode: "dark",
    primary: {
      main: "#00ADEF",
    },
    secondary: {
      // White color
      main: "#FFFFFF",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "1.1rem", //override to make tooltip font size larger
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        thumb: {
          color: "pink", //change the color of the switch thumb in the columns show/hide menu to pink
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: "1.1rem",
        },
      },
    },
  },
  typography: {
    h1: {
      fontSize: "1.8rem",
      lineHeight: "3rem",
      paddingLeft: "1rem",
    },
    h2: {
      fontSize: "2rem",
      lineHeight: "3.5rem",
      fontWeight: "bold",
      marginTop: "1.5rem",
      marginBottom: "1.5rem",
    },
    h3: {
      fontSize: "1.5rem",
      lineHeight: "3rem",
      marginBottom: "1rem",
    },
    h4: {
      fontSize: "1.25rem",
      lineHeight: "2rem",
    },
    h5: {
      fontSize: "1.1rem",
      lineHeight: "3rem",
    },
    h6: {
      fontSize: "1rem",
      lineHeight: "3rem",
    },
    subtitle1: {
      marginBottom: "1rem",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: "2rem",
      marginBottom: "0.5rem",
    },
  },
};
