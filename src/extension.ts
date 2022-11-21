import { randomInt } from 'crypto';
import * as vscode from 'vscode';
import * as data from './ranmanga.js';


export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('remanga.start', async () => {
			await ReMangaPanel.createOrShow(context.extensionUri);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(ReMangaPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				ReMangaPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}



class ReMangaPanel {
	public static currentPanel: ReMangaPanel | undefined;
	public static readonly viewType = 'reManga';
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static async createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		// If we already have a panel, show it.
		if (ReMangaPanel.currentPanel) {
			ReMangaPanel.currentPanel._panel.reveal(column);
			return;
		}
З
		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(ReMangaPanel.viewType, "ReManga", column || vscode.ViewColumn.One, {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
		});

		ReMangaPanel.currentPanel = new ReMangaPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		ReMangaPanel.currentPanel = new ReMangaPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(e => {
			if (this._panel.visible) {
				this._update();
			}
		}, null, this._disposables);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this._disposables);
	}

	public dispose() {
		ReMangaPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() {
		const webview = this._panel.webview;
		this._panel.title = "ReManga";
		this._panel.webview.html = await this._getHtmlForWebview(webview);
	}

	private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {

		const stylesCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));

		let id = randomInt(0, 100);
		let fullMangaData = await data.getFullMangaData(id);
		let mangaPictures = await data.loadPictures(id);

		return ` 
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>ReManga</title>
			<link href="${stylesCssUri}" rel="stylesheet">
			</head>
			<body>
				<h1>${fullMangaData.title_japanese}</h1>
				<h2>${fullMangaData.title}</h2>
				<div class="manga-item-inner">
            <div class="manga-item-img">
              <img src="${fullMangaData.images.jpg.large_image_url}" alt=""/>
            </div>
			<div class="manga-item-info">
			<h1>${fullMangaData.title_english}</h1>
			<p>${fullMangaData.synopsis}</p>
			</div>
			<a href="${fullMangaData.url}">Link to manga</a>
        </div>

  
			</body>
		</html>`;
			
	}
}

