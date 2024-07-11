
export function mapKeycodesToKeysElectron(keycodes: string[]) {
  const keyMap = {
    8: 'Backspace',
    9: 'Tab',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'Capslock',
    27: 'Escape',
    32: 'Space',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'Left',
    38: 'Up',
    39: 'Right',
    40: 'Down',
    44: 'PrintScreen',
    45: 'Insert',
    46: 'Delete',
    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',
    59: ';',
    61: '=',
    65: 'A',
    66: 'B',
    67: 'C',
    68: 'D',
    69: 'E',
    70: 'F',
    71: 'G',
    72: 'H',
    73: 'I',
    74: 'J',
    75: 'K',
    76: 'L',
    77: 'M',
    78: 'N',
    79: 'O',
    80: 'P',
    81: 'Q',
    82: 'R',
    83: 'S',
    84: 'T',
    85: 'U',
    86: 'V',
    87: 'W',
    88: 'X',
    89: 'Y',
    90: 'Z',
    91: 'Meta', // Windows key on Windows/Linux, Cmd on macOS
    92: 'Meta', // Windows key on Windows/Linux, Cmd on macOS
    93: 'ContextMenu', // Context Menu key (right-click key)
    96: 'num0',
    97: 'num1',
    98: 'num2',
    99: 'num3',
    100: 'num4',
    101: 'num5',
    102: 'num6',
    103: 'num7',
    104: 'num8',
    105: 'num9',
    106: 'nummult',
    107: 'numadd',
    109: 'numsub',
    110: 'numdec',
    111: 'numdiv',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'Numlock',
    145: 'Scrolllock',
    173: '-',
    186: ';',
    187: '=',
    188: ',',
    189: '-',
    190: '.',
    191: '/',
    192: '`',
    219: '[',
    220: '\\',
    221: ']',
    222: "'",
    224: 'Meta', // Command on macOS, Super on Windows/Linux
  };
  
  const keys = keycodes.map(keycode => {
    const key = keyMap[keycode];
    return key ? key : keycode;
  });
  
  return keys;
}

// import { UiohookKey } from "uiohook-napi";
// export function getKeyNameLibHook(keyCode: number): string | undefined {
//   for (const key in y) {
//     if (UiohookKey[key] === keyCode) {
//       return key;
//     }
//   }
//   return undefined;
// }