import CoreGraphics
import Foundation

let targetOwner = "qemu-system-arm"
let targetTitle = "Zepp OS Simulator"
let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []

for window in windows {
    let owner = window[kCGWindowOwnerName as String] as? String ?? ""
    let title = window[kCGWindowName as String] as? String ?? ""
    guard owner == targetOwner, title.hasPrefix(targetTitle),
          let bounds = window[kCGWindowBounds as String] as? [String: CGFloat],
          let x = bounds["X"], let y = bounds["Y"],
          let width = bounds["Width"], let height = bounds["Height"] else {
        continue
    }
    let windowId = window[kCGWindowNumber as String] as? UInt32 ?? 0
    print("{\"owner\":\"\(owner)\",\"title\":\"\(title)\",\"windowId\":\(windowId),\"x\":\(x),\"y\":\(y),\"width\":\(width),\"height\":\(height)}")
    exit(0)
}

fputs("No on-screen window matched owner=\(targetOwner), title=\(targetTitle)", stderr)
exit(1)
