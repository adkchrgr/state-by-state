import Cocoa
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var webRoot: URL!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let app = NSApplication.shared
        app.setActivationPolicy(.regular)
        app.appearance = NSAppearance(named: .darkAqua)
        let menu = NSMenu()
        let appItem = NSMenuItem()
        menu.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About State by State", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide State by State", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit State by State", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        let editItem = NSMenuItem()
        menu.addItem(editItem)
        let edit = NSMenu(title: "Edit")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit
        app.mainMenu = menu
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        // UserDefaults keeps native preferences stable even if the app is moved.
        config.userContentController.add(self, name: "savePreferences")
        let saved = UserDefaults.standard.string(forKey: "atlas-settings-v1")
        let seed: String
        if let saved = saved, let data = try? JSONSerialization.data(withJSONObject: saved, options: [.fragmentsAllowed]) {
            seed = String(data: data, encoding: .utf8) ?? "null"
        } else { seed = "null" }
        config.userContentController.addUserScript(WKUserScript(source: "window.nativeSettings = " + seed + ";", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1360, height: 940),
            styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "State by State"
        window.minSize = NSSize(width: 760, height: 660)
        window.contentView = webView
        window.setFrameAutosaveName("StateByStateWindow")
        window.center()
        window.makeKeyAndOrderFront(nil)
        webRoot = Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true)
        webView.loadFileURL(webRoot.appendingPathComponent("index.html"), allowingReadAccessTo: webRoot)
        app.activate(ignoringOtherApps: true)
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let allowed = url.isFileURL && url.standardizedFileURL.path.hasPrefix(webRoot.path + "/")
        decisionHandler(allowed ? .allow : .cancel)
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.name == "savePreferences",
              let value = message.body as? String, value.utf8.count < 4096 else { return }
        UserDefaults.standard.set(value, forKey: "atlas-settings-v1")
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
let delegate = AppDelegate()
let application = NSApplication.shared
application.delegate = delegate
application.run()
