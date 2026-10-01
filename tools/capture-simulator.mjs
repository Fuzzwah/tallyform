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


function click(geometry, x, y) {
  activateSimulator();
  releaseMouseCapture();
  // QEMU captures relative mouse movement: anchor inside an inert corner before targeting a control.
  run(INPUT_BINARY, ['click', ...appPoint(geometry, 10, 10).map(String)]);
  run(INPUT_BINARY, ['click', ...appPoint(geometry, x, y).map(String)]);
  run('sleep', ['0.45']);
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
  if (text.includes('Saved sessions')) {
    click(geometry, 315, 342); // History -> Back
    text = readScreen(geometry, 'setup');
  }
  if (!text.includes('New practice') || !text.includes('outcome') || !text.includes('distance')) {
    fail(`capture requires outcome · distance setup; existing active data is not discarded:\n${text}`);
  }
  click(geometry, 117, 342); // Start a new session
  text = readScreen(geometry, 'initial');
  if (!text.includes('Success') || !text.includes('Failure') || distanceFrom(text) !== 5) {
    fail(`new session did not present a clean distance state:\n${text}`);
  }
  click(geometry, 60, 186); // In-card decrease: 5 m -> 4 m
  text = readScreen(geometry, 'selected');
  if (distanceFrom(text) !== TARGET_DISTANCE || !text.includes('0/0')) {
    fail(`simulator did not reach clean 4 m state:\n${text}`);
  }
  for (let index = 0; index < 5; index += 1) click(geometry, 114, 334); // Success
  click(geometry, 318, 334); // Failure
  text = readScreen(geometry, 'final');
  if (distanceFrom(text) !== TARGET_DISTANCE || !text.includes('5/6') || !text.includes('83%')) {
    fail(`simulator did not reach canonical practice state:\n${text}`);
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
