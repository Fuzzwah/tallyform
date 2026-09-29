import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ROOT, SIMULATOR_TARGET, pngInfo } from './website-generator.mjs';

const INPUT_SOURCE = resolve(ROOT, 'tools/simulator-input.swift');
const OCR_SOURCE = resolve(ROOT, 'tools/simulator-ocr.swift');
const WINDOW_SOURCE = resolve(ROOT, 'tools/simulator-window.swift');
const TOOL_DIR = '/tmp/tallyform-tools';
const INPUT_BINARY = `${TOOL_DIR}/simulator-input`;
const OCR_BINARY = `${TOOL_DIR}/simulator-ocr`;
const WINDOW_BINARY = `${TOOL_DIR}/simulator-window`;
const WINDOW_PROCESS = 'qemu-system-arm';
const WINDOW_TITLE = 'Zepp OS Simulator';
const TITLE_BAR_HEIGHT = 28;
const TARGET_DISTANCE = 4;
function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed${result.stderr ? `: ${result.stderr.trim()}` : ''}`);
  }
  return result.stdout.trim();
}

function ensureTools() {
  mkdirSync(TOOL_DIR, { recursive: true });
  run('swiftc', [INPUT_SOURCE, '-o', INPUT_BINARY]);
  run('swiftc', [OCR_SOURCE, '-framework', 'Vision', '-framework', 'ImageIO', '-o', OCR_BINARY]);
  run('swiftc', [WINDOW_SOURCE, '-o', WINDOW_BINARY]);
}

function activateSimulator() {
  run('osascript', ['-e', `tell application "System Events" to tell process "${WINDOW_PROCESS}" to set frontmost to true`]);
}

function releaseMouseCapture() {
  run('osascript', ['-e', 'tell application "System Events" to key code 5 using {control down, option down}']);
}

function closeSimulatorWindow() {
  run('osascript', ['-e', `tell application "System Events"
    tell process "${WINDOW_PROCESS}"
      repeat with deviceWindow in windows
        if name of deviceWindow starts with "${WINDOW_TITLE}" then
          click (first button of deviceWindow whose subrole is "AXCloseButton")
          exit repeat
        end if
      end repeat
    end tell
    repeat 50 times
      if not (exists process "${WINDOW_PROCESS}") then return
      tell process "${WINDOW_PROCESS}"
        if (count of windows) is 0 then return
        repeat with confirmationWindow in windows
          if exists button "Quit" of confirmationWindow then
            click button "Quit" of confirmationWindow
            return
          else
            repeat with confirmationSheet in sheets of confirmationWindow
              if exists button "Quit" of confirmationSheet then
                click button "Quit" of confirmationSheet
                return
              end if
            end repeat
          end if
        end repeat
      end tell
      delay 0.1
    end repeat
    error "Simulator window did not close after confirming Quit"
  end tell`]);
}

function windowGeometry() {
  let window;
  try {
    window = JSON.parse(run(WINDOW_BINARY, []));
  } catch (error) {
    fail(`could not locate ${WINDOW_PROCESS} window "${WINDOW_TITLE}": ${error.message}`);
  }
  if (window.owner !== WINDOW_PROCESS || !window.title.startsWith(WINDOW_TITLE)) {
    fail(`located an unexpected simulator window: ${JSON.stringify(window)}`);
  }
  if (window.width < 400 || window.height < 500) {
    fail(`unexpected simulator window size: ${window.width}x${window.height}`);
  }
  return {
    left: Number(window.x),
    top: Number(window.y),
    width: Number(window.width),
    height: Number(window.height),
  };
}

function appPoint(geometry, x, y) {
  return [geometry.left + x, geometry.top + TITLE_BAR_HEIGHT + y];
}

function input(geometry, action, ...values) {
  activateSimulator();
  run(INPUT_BINARY, [action, ...values.map(String)]);
}

function click(geometry, x, y) {
  input(geometry, 'click', ...appPoint(geometry, x, y));
  run('sleep', ['0.45']);
}

function swipe(geometry, direction) {
  const x = geometry.left + geometry.width / 2;
  const startY = geometry.top + TITLE_BAR_HEIGHT + 190;
  const endY = startY + (direction === 1 ? -90 : 90);
  input(geometry, 'swipe', x, startY, x, endY, '0.7');
  run('sleep', ['0.7']);
}

function capture(geometry, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  run('/usr/sbin/screencapture', ['-x', '-R', `${geometry.left},${geometry.top},${geometry.width},${geometry.height}`, outputPath]);
  const info = pngInfo(outputPath);
  if (info.width < 800 || info.height < 1000) fail(`simulator screenshot is unexpectedly small: ${info.width}x${info.height}`);
  return info;
}

function readScreen(geometry, label) {
  const path = `/tmp/tallyform-capture-${process.pid}-${label}.png`;
  capture(geometry, path);
  return run(OCR_BINARY, [path]);
}

function distanceFrom(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*m\b/);
  return match ? Number(match[1]) : null;
}

function ensureCanonicalState(geometry) {
  let text = readScreen(geometry, 'before');
  if (text.includes('Press SILVER') || text.includes('Skip')) click(geometry, 266, 472);
  click(geometry, 166, 472);
  click(geometry, 166, 472);
  click(geometry, 359, 168);

  text = readScreen(geometry, 'distance');
  const current = distanceFrom(text);
  if (current === null) fail(`could not read current metric distance from simulator:\n${text}`);
  const delta = Math.round(TARGET_DISTANCE - current);
  if (Math.abs(TARGET_DISTANCE - current) > 0.01 && Math.abs(TARGET_DISTANCE - current - delta) > 0.01) {
    fail(`current distance ${current} m cannot be adjusted to ${TARGET_DISTANCE} m with whole-unit gestures`);
  }
  for (let index = 0; index < Math.abs(delta); index += 1) swipe(geometry, delta > 0 ? 1 : -1);

  text = readScreen(geometry, 'cleared');
  const madeHasPositiveCount = /Made\s*\n\s*[1-9]\b/.test(text);
  const missedHasPositiveCount = /Missed\s*\n\s*[1-9]\b/.test(text);
  // Vision may omit an isolated zero on this simulator skin; reject stale
  // positive counts here and require the exact canonical values after setup.
  if (distanceFrom(text) !== TARGET_DISTANCE || madeHasPositiveCount || missedHasPositiveCount) {
    fail(`simulator did not reach clean canonical distance state:\n${text}`);
  }
  for (let index = 0; index < 5; index += 1) click(geometry, 162, 336);
  click(geometry, 360, 336);
  text = readScreen(geometry, 'final');
  if (distanceFrom(text) !== TARGET_DISTANCE || !text.includes('Made\n5')
    || !text.includes('Missed\n1') || !text.includes('83%') || text.includes('Press SILVER')) {
    fail(`simulator did not reach canonical marketing state:\n${text}`);
  }
  return text;
}

export function captureSimulator(outputPath) {
  ensureTools();
  const geometry = windowGeometry();
  try {
    releaseMouseCapture();
    activateSimulator();
    const ocrText = ensureCanonicalState(geometry);
    const screenshotPath = resolve(outputPath);
    const screenshot = capture(geometry, screenshotPath);
    const result = {
      screenshotPath,
      screenshot,
      simulatorTarget: SIMULATOR_TARGET,
      window: geometry,
      ocrText,
    };
    writeFileSync(`${screenshotPath}.json`, `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } finally {
    closeSimulatorWindow();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const outputIndex = process.argv.indexOf('--output');
  const output = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;
  if (!output) fail('usage: node tools/capture-simulator.mjs --output PATH');
  try {
    console.log(JSON.stringify(captureSimulator(output), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
