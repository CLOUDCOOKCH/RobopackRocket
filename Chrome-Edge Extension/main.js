// main.js - PSADT v4.x Pro (Linter + Custom Snippets + Smart Wrap)

// 1. SETUP: Load Monaco
const monacoBase = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs';
const loader = document.createElement('script');
loader.src = `${monacoBase}/loader.min.js`;
document.head.appendChild(loader);

let activeMonacoEditor = null; 

loader.onload = () => {
    require.config({ paths: { 'vs': monacoBase } });
    require(['vs/editor/editor.main'], function () {
        console.log("RoboPack Pro: Linter & Storage Ready.");
        createFloatingControls(); 
        createGlobalToolbox();    
        attemptAutoDetect();
        startAutoWatch();
        registerPSADT4Autocomplete();
        addCustomStyles();
    });
};

// --- DATA: PSADT LIBRARIES ---
const psadtLibrary = {
    "Robopack Variables": [
        { label: "$installerPath", code: '$installerPath', syntax: "Full path to the installer file." },
        { label: "$uninstallerPath", code: '$uninstallerPath', syntax: "Full path to the uninstaller file." },
        { label: "$appsToClose", code: '$appsToClose', syntax: "List of processes to close (comma-separated)." },
        { label: "$robopackPackageId", code: '$robopackPackageId', syntax: "Unique identifier for this package." },
        { label: "$packageVersion", code: '$packageVersion', syntax: "Version of the package." }
    ],
    "Templates (Blocks)": [
        { 
            label: "Standard MSI Install Block", 
            code: 'Show-ADTInstallationProgress -StatusMessage "Installing Application..."\n\nStart-ADTMsiProcess -Action "Install" -FilePath "$($adtSession.DirFiles)\\Installer.msi"\n\nif ($?) {\n    Write-ADTLogEntry -Message "Install Successful" -Severity 1\n} else {\n    Write-ADTLogEntry -Message "Install Failed" -Severity 3\n}',
            syntax: "Inserts a full installation block with logging."
        },
        { 
            label: "Try / Catch Block", 
            code: 'Try {\n    #CodeHere\n}\nCatch {\n    Write-ADTLogEntry -Message "Error: $($_.Exception.Message)" -Severity 3\n    Throw $_.Exception\n}',
            syntax: "Standard PowerShell Error Handling wrapper."
        },
        {
            label: "If Process Running",
            code: '$proc = Get-Process "chrome" -ErrorAction SilentlyContinue\nif ($proc) {\n    Show-ADTInstallationWelcome -CloseProcesses "chrome"\n}',
            syntax: "Checks if a process is running before acting."
        }
    ],
    "Application Execution": [
        { label: "Start-ADTMsiProcess", code: 'Start-ADTMsiProcess -Action "Install" -FilePath "$($adtSession.DirFiles)\\Installer.msi"', syntax: "Start-ADTMsiProcess -Action <Install/Uninstall> -FilePath <String> [-Arguments <String>]" },
        { label: "Start-ADTProcess", code: 'Start-ADTProcess -FilePath "$($adtSession.DirFiles)\\setup.exe" -ArgumentList "/S" -WindowStyle "Hidden"', syntax: "Start-ADTProcess -FilePath <String> [-ArgumentList <String>] [-WindowStyle <Hidden/Normal>]" },
        { label: "Start-ADTProcessAsUser", code: 'Start-ADTProcessAsUser -FilePath "$($adtSession.DirFiles)\\UserConfig.exe" -Wait', syntax: "Start-ADTProcessAsUser -FilePath <String> [-Wait <Bool>]" },
        { label: "Get-ADTInstalledApplication", code: 'Get-ADTInstalledApplication -Name "Google Chrome"', syntax: "Get-ADTInstalledApplication -Name <String> [-Exact] [-Wildcard]" },
        { label: "Get-ADTProcess", code: 'Get-ADTProcess -Name "notepad"', syntax: "Get-ADTProcess -Name <String>" }
    ],
    "User Interface": [
        { label: "Show-ADTInstallationWelcome", code: 'Show-ADTInstallationWelcome -CloseProcesses "$appsToClose" -AllowDefer -DeferTimes 3', syntax: "Show-ADTInstallationWelcome -CloseProcesses <String[]> [-AllowDefer] [-DeferTimes <Int>]" },
        { label: "Show-ADTInstallationPrompt", code: 'Show-ADTInstallationPrompt -Message "Please save work." -ButtonRightText "OK" -Icon "Information"', syntax: "Show-ADTInstallationPrompt -Message <String> [-ButtonRightText <String>] [-Icon <Info/Warn>]" },
        { label: "Show-ADTInstallationProgress", code: 'Show-ADTInstallationProgress -StatusMessage "Installing..."', syntax: "Show-ADTInstallationProgress -StatusMessage <String> [-TopMost <Bool>]" },
        { label: "Close-ADTInstallationProgress", code: 'Close-ADTInstallationProgress', syntax: "Close-ADTInstallationProgress" },
        { label: "Show-ADTBalloonTip", code: 'Show-ADTBalloonTip -BalloonTipText "Installation Started" -BalloonTipTitle "IT Dept"', syntax: "Show-ADTBalloonTip -BalloonTipText <String> -BalloonTipTitle <String>" },
        { label: "Show-ADTDialog", code: 'Show-ADTDialog -Title "Alert" -Message "Operation complete." -Buttons "OK"', syntax: "Show-ADTDialog -Title <String> -Message <String> -Buttons <OK/YesNo>" },
        { label: "Show-ADTInstallationRestartPrompt", code: 'Show-ADTInstallationRestartPrompt -NoCountdown', syntax: "Show-ADTInstallationRestartPrompt [-NoCountdown] [-CountdownSeconds <Int>]" }
    ],
    "File & Folder": [
        { label: "Copy-ADTFile", code: 'Copy-ADTFile -Path "$($adtSession.DirFiles)\\config.xml" -Destination "$($adtSession.EnvProgramData)\\App\\"', syntax: "Copy-ADTFile -Path <String> -Destination <String> [-Recurse]" },
        { label: "Remove-ADTFile", code: 'Remove-ADTFile -Path "$($adtSession.EnvProgramFiles)\\App\\Old.dll"', syntax: "Remove-ADTFile -Path <String> [-Recurse]" },
        { label: "Remove-ADTFolder", code: 'Remove-ADTFolder -Path "$($adtSession.EnvProgramData)\\OldApp"', syntax: "Remove-ADTFolder -Path <String>" },
        { label: "Get-ADTFileVersion", code: 'Get-ADTFileVersion -FilePath "$($adtSession.EnvSystemRoot)\\system32\\notepad.exe"', syntax: "Get-ADTFileVersion -FilePath <String>" },
        { label: "Set-ADTFileAttribute", code: 'Set-ADTFileAttribute -Path "$($adtSession.EnvProgramData)\\App" -Attribute "Hidden"', syntax: "Set-ADTFileAttribute -Path <String> -Attribute <Hidden/ReadOnly>" },
        { label: "Resolve-ADTPath", code: 'Resolve-ADTPath -Path "$($adtSession.EnvProgramFilesX86)\\App"', syntax: "Resolve-ADTPath -Path <String>" }
    ],
    "Registry Operations": [
        { label: "Set-ADTRegistryKey", code: 'Set-ADTRegistryKey -Key "HKLM\\Software\\App" -Name "Version" -Value "1.0" -Type String', syntax: "Set-ADTRegistryKey -Key <String> -Value <Object> -Type <String/DWord>" },
        { label: "Remove-ADTRegistryKey", code: 'Remove-ADTRegistryKey -Key "HKLM\\Software\\App" -Recurse', syntax: "Remove-ADTRegistryKey -Key <String> [-Recurse]" },
        { label: "Get-ADTRegistryKey", code: 'Get-ADTRegistryKey -Key "HKLM\\Software\\App" -Name "InstallDate"', syntax: "Get-ADTRegistryKey -Key <String> [-Name <String>]" },
        { label: "Test-ADTRegistryKey", code: 'Test-ADTRegistryKey -Key "HKLM\\Software\\App"', syntax: "Test-ADTRegistryKey -Key <String> (Returns Bool)" },
        { label: "Invoke-ADTAllUsersRegistryAction", code: 'Invoke-ADTAllUsersRegistryAction -ScriptBlock { Set-ADTRegistryKey -Key "HKCU\\Software\\App" -Name "Config" -Value "1" }', syntax: "Invoke-ADTAllUsersRegistryAction -ScriptBlock <ScriptBlock>" }
    ],
    "Services & Permissions": [
        { label: "Start-ADTService", code: 'Start-ADTService -Name "Spooler"', syntax: "Start-ADTService -Name <String>" },
        { label: "Stop-ADTService", code: 'Stop-ADTService -Name "Spooler"', syntax: "Stop-ADTService -Name <String>" },
        { label: "Remove-ADTService", code: 'Remove-ADTService -Name "OldService"', syntax: "Remove-ADTService -Name <String>" },
        { label: "Set-ADTServiceStartMode", code: 'Set-ADTServiceStartMode -Name "wuauserv" -StartMode "Automatic"', syntax: "Set-ADTServiceStartMode -Name <String> -StartMode <Auto/Manual/Disabled>" },
        { label: "Test-ADTServiceExists", code: 'Test-ADTServiceExists -Name "Spooler"', syntax: "Test-ADTServiceExists -Name <String> (Returns Bool)" },
        { label: "Set-ADTFileSystemAccess", code: 'Set-ADTFileSystemAccess -Path "$($adtSession.EnvProgramData)\\App" -Users "Users" -AccessRights "Modify"', syntax: "Set-ADTFileSystemAccess -Path <String> -AccessRights <Modify/FullControl>" }
    ],
    "System & Misc": [
        { label: "New-ADTShortcut", code: 'New-ADTShortcut -Path "$($adtSession.EnvCommonStartMenuPrograms)\\App.lnk" -TargetPath "$($adtSession.EnvProgramFiles)\\App\\app.exe"', syntax: "New-ADTShortcut -Path <String> -TargetPath <String>" },
        { label: "Write-ADTLogEntry", code: 'Write-ADTLogEntry -Message "Custom Log Entry" -Severity 1', syntax: "Write-ADTLogEntry -Message <String> -Severity <1(Info)/2(Warn)/3(Error)>" },
        { label: "Get-ADTLoggedOnUser", code: 'Get-ADTLoggedOnUser', syntax: "Get-ADTLoggedOnUser (Returns User Object)" },
        { label: "Get-ADTOperatingSystemName", code: 'Get-ADTOperatingSystemName', syntax: "Get-ADTOperatingSystemName" },
        { label: "Test-ADTNetworkConnection", code: 'Test-ADTNetworkConnection', syntax: "Test-ADTNetworkConnection (Returns Bool)" },
        { label: "Test-ADTPowerPoint", code: 'Test-ADTPowerPoint', syntax: "Test-ADTPowerPoint (Check if PPT is running presentation)" }
    ]
};

// 2. LOGIC: Editor Creation with Linter
function convertToMonaco(originalTextarea) {
    if (originalTextarea.getAttribute('data-monaco-active') === 'true') return;
    originalTextarea.setAttribute('data-monaco-active', 'true');

    // Container
    const wrapper = document.createElement('div');
    wrapper.className = 'monaco-wrapper-std'; 
    wrapper.style.cssText = "position: relative; width:100%; height:600px; margin-bottom:20px; border:1px solid #3e3e3e; background: #1e1e1e;";

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = "position: absolute; top: 0; right: 0; z-index: 50; display: flex;";
    
    // Buttons
    const btnStyle = "background: #252526; color: #ccc; border: none; border-left: 1px solid #3e3e3e; cursor: pointer; padding: 5px 12px; font-size: 14px; font-family: monospace; font-weight: bold;";
    
    const lintBtn = document.createElement('button');
    lintBtn.innerHTML = "🧹 Check v4"; 
    lintBtn.title = "Scan for old v3 commands";
    lintBtn.style.cssText = btnStyle;

    const formatBtn = document.createElement('button');
    formatBtn.innerHTML = "{ }"; 
    formatBtn.title = "Format Code";
    formatBtn.style.cssText = btnStyle;
    
    const zenBtn = document.createElement('button');
    zenBtn.innerHTML = "⤢"; 
    zenBtn.title = "Toggle Fullscreen";
    zenBtn.style.cssText = "background: #0078D4; color: white; border: none; cursor: pointer; padding: 5px 12px; font-size: 16px;";
    
    const placeholder = document.createComment("monaco-home-placeholder");
    
    toolbar.appendChild(lintBtn);
    toolbar.appendChild(formatBtn);
    toolbar.appendChild(zenBtn);
    wrapper.appendChild(toolbar);

    originalTextarea.parentNode.insertBefore(wrapper, originalTextarea);
    originalTextarea.style.display = 'none';

    // Initialize Monaco
    const editor = monaco.editor.create(wrapper, {
        value: originalTextarea.value,
        language: 'powershell',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: "Consolas, 'Courier New', monospace",
        formatOnPaste: true,
        formatOnType: true
    });

    // Actions
    formatBtn.onclick = () => editor.getAction('editor.action.formatDocument').run();
    zenBtn.onclick = () => toggleZenMode(wrapper, editor, placeholder, zenBtn);
    lintBtn.onclick = () => runV4MigrationCheck(editor);

    // Sync
    editor.onDidFocusEditorText(() => {
        activeMonacoEditor = editor;
        highlightActiveContainer(wrapper);
    });
    activeMonacoEditor = editor;

    editor.onDidChangeModelContent(() => {
        originalTextarea.value = editor.getValue();
        originalTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        originalTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    editor.addCommand(monaco.KeyCode.Escape, () => {
        if (wrapper.classList.contains('zen-mode')) toggleZenMode(wrapper, editor, placeholder, zenBtn);
    });
}

// 3. FEATURE: V3 -> V4 Migration Linter
function runV4MigrationCheck(editor) {
    const code = editor.getValue();
    const v3Map = {
        "Execute-MSI": "Start-ADTMsiProcess",
        "Execute-Process": "Start-ADTProcess",
        "Show-InstallationWelcome": "Show-ADTInstallationWelcome",
        "Show-InstallationPrompt": "Show-ADTInstallationPrompt",
        "Show-InstallationProgress": "Show-ADTInstallationProgress",
        "Write-Log": "Write-ADTLogEntry",
        "Copy-File": "Copy-ADTFile",
        "Remove-File": "Remove-ADTFile",
        "Set-RegistryKey": "Set-ADTRegistryKey"
    };

    let issues = 0;
    const model = editor.getModel();
    const markers = [];

    // Simple Regex scan for old commands
    for (const [v3, v4] of Object.entries(v3Map)) {
        const regex = new RegExp(v3, "gi");
        let match;
        while ((match = regex.exec(code)) !== null) {
            issues++;
            const startPos = model.getPositionAt(match.index);
            const endPos = model.getPositionAt(match.index + match[0].length);
            
            markers.push({
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
                message: `Deprecated v3 command: '${match[0]}'. Use '${v4}' instead.`
            });
        }
    }

    monaco.editor.setModelMarkers(model, "owner", markers);

    if (issues > 0) {
        alert(`⚠️ Found ${issues} deprecated v3 commands! Check the yellow warnings in the editor.`);
    } else {
        alert("✅ Code looks v4 compliant!");
    }
}

// 4. FEATURE: Custom Snippets (Local Storage)
function getCustomSnippets() {
    return JSON.parse(localStorage.getItem('psadt_custom_snippets') || '[]');
}

function saveCustomSnippet(label, code) {
    const snippets = getCustomSnippets();
    snippets.push({ label, code, syntax: "Custom Snippet" });
    localStorage.setItem('psadt_custom_snippets', JSON.stringify(snippets));
    refreshToolbox(); // Re-render
}

function deleteCustomSnippet(index) {
    const snippets = getCustomSnippets();
    snippets.splice(index, 1);
    localStorage.setItem('psadt_custom_snippets', JSON.stringify(snippets));
    refreshToolbox();
}

// 5. FEATURE: Teleport Zen Mode
function toggleZenMode(wrapper, editor, placeholder, btn) {
    if (wrapper.classList.contains('zen-mode')) {
        wrapper.classList.remove('zen-mode');
        btn.innerHTML = "⤢"; 
        wrapper.style.cssText = "position: relative; width:100%; height:600px; margin-bottom:20px; border:1px solid #3e3e3e; background: #1e1e1e;";
        if (placeholder.parentNode) {
            placeholder.parentNode.insertBefore(wrapper, placeholder);
            placeholder.remove();
        }
        document.body.style.overflow = "auto"; 
    } else {
        wrapper.classList.add('zen-mode');
        btn.innerHTML = "✖"; 
        wrapper.parentNode.insertBefore(placeholder, wrapper);
        document.body.appendChild(wrapper);
        wrapper.style.cssText = `
            position: fixed !important; top: 0 !important; left: 0 !important; 
            width: 100vw !important; height: 100vh !important; 
            z-index: 2147483647 !important; border: none; background: #1e1e1e;
        `;
        document.body.style.overflow = "hidden"; 
    }
    editor.layout();
    editor.focus();
}

function highlightActiveContainer(container) {
    document.querySelectorAll('.monaco-wrapper-std').forEach(el => {
        el.style.borderColor = "#3e3e3e";
    });
    if (!container.classList.contains('zen-mode')) container.style.borderColor = "#0078D4";
}

// 6. UI: Global Toolbox with Custom Tab
function createGlobalToolbox() {
    const toolbox = document.createElement('div');
    toolbox.id = 'psadt-toolbox-panel';
    toolbox.style.cssText = `
        position: fixed; top: 0; right: -360px; width: 350px; height: 100vh;
        background: #1e1e1e; border-left: 2px solid #0078D4; z-index: 2147483647;
        transition: right 0.3s cubic-bezier(0.25, 1, 0.5, 1); 
        box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; font-family: 'Segoe UI', sans-serif;
    `;

    const header = document.createElement('div');
    header.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>🛠 PSADT v4 Pro</span>
            <span style='cursor:pointer; font-size:18px; padding:5px;' id='close-toolbox'>✖</span>
        </div>
        <div style="display:flex; gap:5px; margin-top:10px;">
            <input type="text" id="toolbox-search" placeholder="Search..." style="flex:1; padding:6px; background:#2d2d2d; border:1px solid #444; color:white; border-radius:4px;">
            <button id="add-snippet-btn" title="Add Custom Snippet" style="background:#0078D4; border:none; color:white; border-radius:4px; width:30px; cursor:pointer;">+</button>
        </div>
    `;
    header.style.cssText = "padding: 15px; background: #0078D4; color: white; font-weight: bold;";
    toolbox.appendChild(header);

    const content = document.createElement('div');
    content.id = 'toolbox-content';
    content.style.cssText = "flex: 1; overflow-y: auto; padding-bottom: 20px;";
    toolbox.appendChild(content);

    const helpPanel = document.createElement('div');
    helpPanel.id = 'toolbox-help';
    helpPanel.style.cssText = "height: 140px; background: #252526; border-top: 2px solid #0078D4; padding: 15px; color: #ccc; font-size: 12px; overflow-y: auto; line-height: 1.4;";
    helpPanel.innerHTML = "<b>Info:</b><br>Hover over '?' to see help.";
    toolbox.appendChild(helpPanel);

    header.querySelector('#close-toolbox').onclick = toggleToolbox;
    header.querySelector('#toolbox-search').onkeyup = (e) => filterToolbox(e.target.value);
    header.querySelector('#add-snippet-btn').onclick = promptAddSnippet;

    document.body.appendChild(toolbox);
    refreshToolbox(); // Initial render
}

function promptAddSnippet() {
    if (!activeMonacoEditor) { alert("Please select code in the editor first!"); return; }
    
    const selection = activeMonacoEditor.getModel().getValueInRange(activeMonacoEditor.getSelection());
    if (!selection) { alert("Highlight some code in the editor to save it as a snippet."); return; }

    const name = prompt("Name your snippet:");
    if (name) saveCustomSnippet(name, selection);
}

function refreshToolbox() {
    const container = document.getElementById('toolbox-content');
    if (!container) return;
    
    // Merge standard lib with custom snippets
    const fullLib = { ...psadtLibrary };
    const custom = getCustomSnippets();
    if (custom.length > 0) fullLib["My Custom Snippets"] = custom;

    renderToolboxItems(container, fullLib);
}

function renderToolboxItems(container, data) {
    container.innerHTML = '';
    for (const [category, items] of Object.entries(data)) {
        const catHeader = document.createElement('div');
        catHeader.innerText = category;
        catHeader.className = 'toolbox-category';
        catHeader.style.cssText = "padding: 10px 15px; background: #2d2d2d; color: #aaa; font-size: 11px; font-weight: bold; text-transform: uppercase; border-top: 1px solid #383838; letter-spacing: 0.5px;";
        if (category === "Robopack Variables") catHeader.style.color = "#4FC1FF";
        if (category === "My Custom Snippets") catHeader.style.color = "#57D066"; // Green

        container.appendChild(catHeader);

        items.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'toolbox-row';
            row.style.cssText = "display: flex; border-bottom: 1px solid #2a2a2a;";

            const btn = document.createElement('button');
            btn.innerText = item.label;
            btn.style.cssText = "flex: 1; padding: 10px 15px; background: transparent; color: #e0e0e0; border: none; text-align: left; cursor: pointer; font-size: 13px; font-family: 'Segoe UI', sans-serif; transition: background 0.2s;";
            btn.onmouseover = () => btn.style.background = "#333";
            btn.onmouseout = () => btn.style.background = "transparent";
            btn.onclick = () => insertSnippet(item.code);

            // Help or Delete Button
            const actionBtn = document.createElement('button');
            if (category === "My Custom Snippets") {
                actionBtn.innerText = "🗑";
                actionBtn.style.color = "#ff5555";
                actionBtn.onclick = (e) => { e.stopPropagation(); deleteCustomSnippet(index); };
            } else {
                actionBtn.innerText = "?";
                actionBtn.style.color = "#0078D4";
                actionBtn.onclick = (e) => { e.stopPropagation(); showHelp(item.label, item.syntax); };
            }
            
            actionBtn.style.cssText += "width: 35px; background: transparent; border: none; cursor: pointer; font-weight: bold; border-left: 1px solid #2a2a2a; font-size: 14px;";
            actionBtn.onmouseover = () => { actionBtn.style.background = "#333"; if(category !== "My Custom Snippets") showHelp(item.label, item.syntax); };
            actionBtn.onmouseout = () => actionBtn.style.background = "transparent";

            row.appendChild(btn);
            row.appendChild(actionBtn);
            container.appendChild(row);
        });
    }
}

// 7. HELPER: Utils & Smart Insert
function insertSnippet(code) {
    if (!activeMonacoEditor) { alert("⚠️ Click inside an editor first!"); return; }
    
    const selection = activeMonacoEditor.getSelection();
    const selectedText = activeMonacoEditor.getModel().getValueInRange(selection);
    
    // Smart Wrap: If snippet contains #CodeHere and text is selected, wrap it
    let finalCode = code;
    if (selectedText && code.includes("#CodeHere")) {
        finalCode = code.replace("#CodeHere", selectedText);
    } else if (selectedText && code.includes("...")) { // Fallback for some templates
        finalCode = code.replace("...", selectedText);
    }

    activeMonacoEditor.executeEdits("toolbox", [{
        range: selection,
        text: finalCode, 
        forceMoveMarkers: true
    }]);
    activeMonacoEditor.focus();
    activeMonacoEditor.getAction('editor.action.formatDocument').run(); // Auto-format after insert
}

function showHelp(title, syntax) {
    document.getElementById('toolbox-help').innerHTML = `<strong style="color:#fff; font-size:13px;">${title}</strong><br><br><code style="color:#4ec9b0; font-family: Consolas;">${syntax}</code>`;
}

function filterToolbox(query) {
    const term = query.toLowerCase();
    document.querySelectorAll('.toolbox-row').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? 'flex' : 'none';
    });
}

function toggleToolbox() {
    const toolbox = document.getElementById('psadt-toolbox-panel');
    const btn = document.getElementById('toolbox-toggle-btn');
    if (toolbox.style.right === "0px") {
        toolbox.style.right = "-360px";
        btn.style.background = "#333";
    } else {
        toolbox.style.right = "0px";
        btn.style.background = "#0078D4";
    }
}

// 8. UI: Buttons
function createFloatingControls() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; display: flex; gap: 10px;";
    
    const toolsBtn = document.createElement('button');
    toolsBtn.id = 'toolbox-toggle-btn';
    toolsBtn.innerHTML = "🛠 Toolbox";
    toolsBtn.style.cssText = "padding: 12px 20px; background: #333; color: white; border: 2px solid white; border-radius: 50px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-family: 'Segoe UI', sans-serif; transition: all 0.2s;";
    toolsBtn.onclick = toggleToolbox;

    const fixBtn = document.createElement('button');
    fixBtn.id = 'robo-fix-btn';
    fixBtn.innerHTML = "⚡ Fix Editors";
    fixBtn.style.cssText = "padding: 12px 20px; background: #0078D4; color: white; border: 2px solid white; border-radius: 50px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-family: 'Segoe UI', sans-serif; transition: all 0.2s;";
    fixBtn.onclick = () => { attemptAutoDetect(); updateButtonStatus("Scanning..."); };

    wrapper.appendChild(toolsBtn);
    wrapper.appendChild(fixBtn);
    document.body.appendChild(wrapper);
}

// 9. HELPER: Autocomplete
function registerPSADT4Autocomplete() {
    monaco.languages.registerCompletionItemProvider('powershell', {
        provideCompletionItems: function (model, position) {
            const suggestions = [];
            for (const category of Object.values(psadtLibrary)) {
                for (const snip of category) {
                    suggestions.push({
                        label: snip.label,
                        kind: category === "Robopack Variables" ? monaco.languages.CompletionItemKind.Variable : monaco.languages.CompletionItemKind.Function,
                        insertText: snip.code,
                        documentation: snip.syntax,
                        detail: category
                    });
                }
            }
            return { suggestions: suggestions };
        }
    });
}

function attemptAutoDetect() {
    document.querySelectorAll('textarea').forEach(t => { if (shouldConvert(t)) convertToMonaco(t); });
}
function shouldConvert(t) {
    if (t.offsetParent === null) return false;
    if (t.getAttribute('data-monaco-active') === 'true') return false;
    if (t.clientHeight < 60) return false;
    return true;
}
function updateButtonStatus(msg) {
    const btn = document.getElementById('robo-fix-btn');
    if (btn) {
        const old = "⚡ Fix Editors";
        btn.innerText = msg;
        setTimeout(() => btn.innerText = old, 2000);
    }
}
let debounceTimer = null;
function startAutoWatch() {
    new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(attemptAutoDetect, 500);
    }).observe(document.body, { childList: true, subtree: true });
}

function addCustomStyles() {
    const style = document.createElement('style');
    style.innerHTML = `.toolbox-row:hover button { color: white !important; }`;
    document.head.appendChild(style);
}