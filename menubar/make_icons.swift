// Renders icons/mic-live.png (green mic) and icons/mic-muted.png (red crossed-out mic) for the menu bar.
// SwiftBar draws its own sfimage symbols white in the menu bar, so the colored icons are pre-drawn. Run here: swift make_icons.swift
import AppKit
func hex(_ h: Int) -> NSColor { NSColor(srgbRed: CGFloat(h >> 16 & 255) / 255, green: CGFloat(h >> 8 & 255) / 255, blue: CGFloat(h & 255) / 255, alpha: 1) }
try! FileManager.default.createDirectory(atPath: "icons", withIntermediateDirectories: true)
for (name, symbol, color) in [("mic-live", "mic.fill", 0x34C759), ("mic-muted", "mic.slash.fill", 0xFF3B30)] {
    let cfg = NSImage.SymbolConfiguration(pointSize: 15, weight: .medium).applying(.init(paletteColors: [hex(color)]))
    let sym = NSImage(systemSymbolName: symbol, accessibilityDescription: nil)!.withSymbolConfiguration(cfg)!
    let size = NSSize(width: 20, height: 20)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 40, pixelsHigh: 40, bitsPerSample: 8, samplesPerPixel: 4,
                               hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let s = sym.size
    sym.draw(in: NSRect(x: (size.width - s.width) / 2, y: (size.height - s.height) / 2, width: s.width, height: s.height))
    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "icons/\(name).png"))
}
