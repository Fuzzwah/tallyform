import CoreGraphics
import Foundation

struct Point {
    let x: Double
    let y: Double
}

func fail(_ message: String) -> Never {
    fputs("simulator-input: \(message)\n", stderr)
    exit(2)
}

func number(_ value: String) -> Double {
    guard let result = Double(value) else { fail("invalid coordinate: \(value)") }
    return result
}

let mainDisplay = CGMainDisplayID()
let displayBounds = CGDisplayBounds(mainDisplay)
let displayScale = max(1.0, Double(CGDisplayPixelsWide(mainDisplay)) / displayBounds.width)
func point(_ x: String, _ y: String) -> CGPoint {
    CGPoint(x: number(x) * displayScale, y: number(y) * displayScale)
}

let source = CGEventSource(stateID: .hidSystemState)

func post(_ event: CGEvent) {
    event.post(tap: .cghidEventTap)
}

func move(to location: CGPoint) {
    guard let event = CGEvent(mouseEventSource: source, mouseType: .mouseMoved,
                              mouseCursorPosition: location, mouseButton: .left) else {
        fail("could not create mouse move event")
    }
    post(event)
}

func click(at location: CGPoint) {
    move(to: location)
    usleep(50_000)
    guard let down = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown,
                             mouseCursorPosition: location, mouseButton: .left),
          let up = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp,
                           mouseCursorPosition: location, mouseButton: .left) else {
        fail("could not create mouse click event")
    }
    post(down)
    usleep(50_000)
    post(up)
}

func swipe(from start: CGPoint, to end: CGPoint, duration: TimeInterval) {
    move(to: start)
    usleep(100_000)
    guard let down = CGEvent(mouseEventSource: source, mouseType: .leftMouseDown,
                             mouseCursorPosition: start, mouseButton: .left) else {
        fail("could not create mouse-down event")
    }
    post(down)
    let steps = max(2, Int(duration * 60))
    for index in 1...steps {
        let progress = Double(index) / Double(steps)
        let location = CGPoint(
            x: start.x + (end.x - start.x) * progress,
            y: start.y + (end.y - start.y) * progress
        )
        move(to: location)
        usleep(UInt32(duration * 1_000_000 / Double(steps)))
    }
    guard let up = CGEvent(mouseEventSource: source, mouseType: .leftMouseUp,
                           mouseCursorPosition: end, mouseButton: .left) else {
        fail("could not create mouse-up event")
    }
    post(up)
}

let arguments = Array(CommandLine.arguments.dropFirst())
guard let action = arguments.first else { fail("expected click or swipe") }

switch action {
case "click":
    guard arguments.count == 3 else { fail("usage: click X Y") }
    click(at: point(arguments[1], arguments[2]))
case "swipe":
    guard arguments.count == 6 else { fail("usage: swipe X1 Y1 X2 Y2 SECONDS") }
    let duration = number(arguments[5])
    guard duration > 0 else { fail("swipe duration must be positive") }
    swipe(from: point(arguments[1], arguments[2]), to: point(arguments[3], arguments[4]), duration: duration)
default:
    fail("unknown action: \(action)")
}
