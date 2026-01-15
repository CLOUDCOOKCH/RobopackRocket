# 🚀 RoboPack Pro Editor

![Version](https://img.shields.io/badge/version-2.1-blue) ![Type](https://img.shields.io/badge/Browser%20Extension-Chrome%20%7C%20Edge%20%7C%20Firefox-orange) ![License](https://img.shields.io/badge/license-MIT-green)

**Supercharging the RoboPack script editor with VS Code (Monaco), PSADT v4 Tools, and Zen Mode.**

---

## 🧐 The Problem
We rely heavily on tools like RoboPack to streamline Intune packaging. It does a great job abstracting the complexities of `.intunewin` creation.

But if you do serious customization, you hit a wall: **The Script Editor.**

Trying to write complex PowerShell/PSADT scripts inside a tiny, non-resizable `<textarea>` is painful. There is no syntax highlighting, no formatting help, and zero IntelliSense. I got tired of copy-pasting code back and forth from VS Code, so I built this extension to fix the UI myself.

## 🛠 What This Extension Does
This browser extension hijacks the RoboPack script page, hides the basic text area, and mounts the **Monaco Editor** (the engine behind VS Code) in its place.

The result is an instant upgrade from Notepad to a full IDE inside your browser.

## ✨ Key Features

### 1. True VS Code Experience
* Full PowerShell syntax highlighting.
* Automatic indentation & bracket matching.
* Familiar "Dark Plus" theme.
* **Auto-Format:** Click `{ }` to instantly clean up messy code.

### 2. The PSADT v4 Toolbox
A slide-out sidebar containing the massive library of **PSADT v4 functions**.
* **Searchable:** Find `Set-ADTRegistryKey` or `Show-ADTInstallationPrompt` instantly.
* **One-Click Insert:** Injects fully formatted snippets directly into your cursor position.
* **Help System:** Hover over `?` to see syntax and parameters.

### 3. Zen Mode (Teleport) ⤢
The RoboPack UI can feel cramped.
* Click the **Expand** button to "teleport" the editor out of the page frame.
* Expands to **100% Fullscreen**.
* Distraction-free coding environment.

### 4. Migration Linter (v3 ➔ v4) 🧹
Still typing `Execute-MSI` out of habit?
* The editor scans your code for deprecated v3 commands.
* Underlines them and warns you to switch to modern v4 standards (e.g., `Start-ADTMsiProcess`).

### 5. Integrated RoboPack Variables
No more scrolling up to remember variable names. The following are added to Autocomplete:
* `$installerPath`
* `$uninstallerPath`
* `$appsToClose`
* `$robopackPackageId`

---

## 📥 Installation

Since this is a specialized tool for packagers, it is installed as an "Unpacked Extension."

### 1. Download the Source
Clone this repository or download the files to a local folder. You should have:
* `manifest.json`
* `loader.js`
* `main.js`
* `icon.png`

### 2. Install in Chrome / Edge
1.  Navigate to `chrome://extensions` or `edge://extensions`.
2.  Enable **Developer Mode** (toggle in the top right/left).
3.  Click **Load Unpacked**.
4.  Select the folder where you saved the files.

### 3. Usage
Navigate to any script page in RoboPack (e.g., "Custom App Settings" > "Post-Install Script"). The editor will load automatically.

---

## 📸 Screenshots

> *Add a screenshot here showing the Editor with the Toolbox open*

> *Add a screenshot here showing Zen Mode*

---

## ⚠️ Disclaimer
This is a community project and is **not** affiliated with or endorsed by RoboPack. Use it at your own risk. It uses a "Shadow Sync" method to ensure your code is saved to the original form fields, but always verify your scripts before deployment.

---

## 🤝 Contributing
Got a better snippet? Found a bug?
1.  Fork the repo.
2.  Create a branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  Open a Pull Request.

**Happy Packaging!** 📦
