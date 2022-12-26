// This file listens for custom key combinations and does some stuff after.
// If you are not MP3Martin, you can use this as an example for something or modify it for yourself.
// Saddly only tested on Windows 10.
import { parse } from 'stack-trace';
import GlobalKeyboardListener from 'node-global-key-listener';
import robot from 'kbm-robot';
import activeWindow from 'active-win';
import bindKeyMouse from './bindKeyMouse.js';

// - SETUP -
const v = new GlobalKeyboardListener.GlobalKeyboardListener();

customTry(() => {
  robot.startJar();
}, 'starting robot server');

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

function customTry (fun, msg) {
  try {
    fun();
  } catch (e) {
    console.error(`Failed ${msg} (on line ${parse(e)[0].lineNumber})`);
    process.exit(1);
  }
}

function listenKeys (key, funct, ignoreShift = true, singleKey = true, matchDown = false) {
  v.addListener(function (e, down) {
    const filteredDown = {};
    filteredDown.value = filterObject(down, (key, value) => { return value === true; });

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
function typeKeys(keys) {
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
    const badNames = value[1];
    const binds = value[2];
    const keypressDelay = value[3];

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
          for (const badName of badNames) {
            if (winName().includes(badName) && !names.includes(badName)) {
              return;
            }
          }
          setTimeout(() => {
            typeKey(bindValue);
          }, keypressDelay);
        }
      }, null, null, fKey);
    }
  }
}

// - MAIN -

console.log('Running');

customTry(() => {
  parseBindKeyMouse(bindKeyMouse);
}, 'parsing bindKeyMouse');
