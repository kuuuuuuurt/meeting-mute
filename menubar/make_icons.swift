// Renders icons/mic-live.png (green pill, white mic) and icons/mic-muted.png (red pill, white crossed-out mic) for the menu bar.
// SwiftBar draws its own sfimage symbols white in the menu bar, so the colored icons are pre-drawn. Run here: swift make_icons.swift
import AppKit
func hex(_ h: Int) -> NSColor { NSColor(srgbRed: CGFloat(h >> 16 & 255) / 255, green: CGFloat(h >> 8 & 255) / 255, blue: CGFloat(h & 255) / 255, alpha: 1) }
try! FileManager.default.createDirectory(atPath: "icons", withIntermediateDirectories: true)
// Styled like macOS's own camera-in-use indicator: a colored pill with a white symbol.
for (name, symbol, color) in [("mic-live", "mic.fill", 0x2ED259), ("mic-muted", "mic.slash.fill", 0xFF3B30)] {
    let size = NSSize(width: 42, height: 24)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 84, pixelsHigh: 48, bitsPerSample: 8, samplesPerPixel: 4,
                               hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    hex(color).setFill()
    NSBezierPath(roundedRect: NSRect(x: 1, y: 0, width: 40, height: 24), xRadius: 12, yRadius: 12).fill()
    let cfg = NSImage.SymbolConfiguration(pointSize: 13, weight: .semibold).applying(.init(paletteColors: [.white]))
    let sym = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)!.withSymbolConfiguration(cfg)!
    let s = sym.size
    sym.draw(in: NSRect(x: (size.width - s.width) / 2, y: (size.height - s.height) / 2, width: s.width, height: s.height))
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "icons/\(name).png"))
}
