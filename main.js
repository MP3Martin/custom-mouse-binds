// This file listens for custom key combinations and does some stuff after.
// If you are not MP3Martin, you can use this as an example for something or modify it for yourself.
// Saddly only tested on windows.
const GlobalKeyboardListener = require('node-global-key-listener');
const robot = require('kbm-robot');
const activeWindow = require('active-win');

// - SETUP -
const v = new GlobalKeyboardListener.GlobalKeyboardListener();

robot.startJar();

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((eventType) => {
  process.on(eventType, cleanup);
});

let stopMsg = true;

// - CUSTOM FUNCTIONS -
function filterObject (object, cond) {
  const out = {};
  for (const key in object) {
    const value = object[key];
    if (cond(key, value)) {
      out[key] = value;
    }
  }
  return out;
}

function listenKeys (key, funct, ignoreShift = true, singleKey = true, matchDown = false) {
  v.addListener(function (e, down) {
    const filteredDown = {};
    filteredDown.value = filterObject(down, (key, value) => { return value === true; });
    // console.log(filteredDown);

    if (matchDown !== false) {
      if (filteredDown.value[matchDown] === true && filteredDown.value['LEFT CTRL'] === true && filteredDown.value['LEFT ALT'] === true) {
        // both keys sets match
        funct();
      } else {
        return false;
      }
    } else if (e.state === 'DOWN' && e.name === key.toUpperCase()) {
      if (ignoreShift) {
        filteredDown.value = filterObject(filteredDown.value, (key, value) => { return !key.toLowerCase().includes('shift'); });
      }
      filteredDown.length = Object.keys(filteredDown.value).length;
      // if singleKey checking is enabled
      if (singleKey) {
        if (filteredDown.length === 1) {
          // singleKey check applies
          funct();
        } else {
          // singleKey check is not true, let the keypress run
          return false;
        }
      } else {
        // singleKey is not enabled, just run the function
        funct();
      }
      return true;
    }
  });
}

// eslint-disable-next-line
function typeKeys (keys) {
  robot.typeString(keys).go();
}

function typeKey (keys) {
  robot.type(keys).go();
}

function getWindow () {
  const win = activeWindow.getOpenWindowsSync();
  return win[0];
}

function cleanup () {
  try {
    // try to stop robot the server
    robot.stopJar();
  } catch (e) {
    // stopping robot server failed, don't do anything else
    return;
  }
  // stopping robot server was successful, log it in the console
  console.log('Stopped robot server');

  // log cleanup complete only once
  if (stopMsg) {
    console.log('Cleanup complete');
  }
  stopMsg = false;
}

function parseBindKeyMouse (object) {
  for (const key in object) {
    // setup consts
    const value = object[key];
    const binds = value[1];

    // create names
    const names = value[0];
    names.push(key);

    // parse binds
    for (const bindName in binds) {
      // setup consts
      const bindValue = binds[bindName];
      const fKey = 'NUMPAD ' + bindName.toString();

      listenKeys(fKey, () => {
        const winName = () => { return getWindow().title; };

        // if the title contains all the names
        if (names.every(item => winName().includes(item))) {
          setTimeout(() => {
            typeKey(bindValue);
          }, 140);
        }
      }, null, null, fKey);
    }
  }
}

// - MAIN -

console.log('Running');

//   ---------------  ↓ MODIFY FROM HERE ↓  ---------------

// FORMAT:
// Name: [[otherStringRequiredInName], {1:stringOrFunction, 2:stringOrFunction}]

/* eslint-disable */
const bindKeyMouse = {
  Minecraft: [ // window name
    ['-'],     // required string(s) in window's name
    {
      5: 'e', // pressing [CTRL + ALT + NUMPAD 5] presses key [E]
      7: 'x'  // use your mouse macro editor to create the [CTRL + ALT + NUMPAD 7] key combination
    }
  ]
};
/* eslint-enable */

parseBindKeyMouse(bindKeyMouse);
