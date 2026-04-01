/**
 * @file examples/HelloWorldPlugin.ts
 * @description 示例插件 - 演示如何使用 Plugin SDK 开发插件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status example
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,example,hello-world
 */

import {
  BasePlugin,
  createPlugin,
  type PluginManifest,
  type PluginAPI,
  type PluginContext,
  type PanelOptions,
  type MenuItemOptions,
} from '../core/PluginSDK';

export class HelloWorldPlugin extends BasePlugin {
  private panelHandle: ReturnType<PluginAPI['ui']['registerPanel']> | null = null;
  private menuHandle: ReturnType<PluginAPI['ui']['registerMenuItem']> | null = null;

  protected async onActivate(): Promise<void> {
    this.log('info', 'Hello World Plugin activating...');

    const { editor, ui, ai, storage, events } = this.api;

    await this.setupPanel(ui);
    await this.setupMenu(ui);
    await this.setupEvents(events);
    await this.setupAI(ai);
    await this.setupStorage(storage);

    this.log('info', 'Hello World Plugin activated successfully!');
  }

  protected async onDeactivate(): Promise<void> {
    this.log('info', 'Hello World Plugin deactivating...');

    this.cleanupPanel();
    this.cleanupMenu();

    this.log('info', 'Hello World Plugin deactivated successfully!');
  }

  private async setupPanel(ui: PluginAPI['ui']): Promise<void> {
    const panelOptions: PanelOptions = {
      id: 'hello-world-panel',
      title: 'Hello World',
      icon: '👋',
      position: 'right',
      render: (container) => {
        container.innerHTML = `
          <div style="padding: 20px;">
            <h2>Hello World!</h2>
            <p>This is a sample plugin.</p>
            <button id="hello-btn">Say Hello</button>
            <div id="hello-output" style="margin-top: 10px; color: #666;"></div>
          </div>
        `;

        const button = container.querySelector('#hello-btn');
        const output = container.querySelector('#hello-output');

        button?.addEventListener('click', async () => {
          if (output) {
            output.textContent = 'Hello from plugin!';
            await this.sayHello();
          }
        });
      },
      onActivate: () => {
        this.log('info', 'Hello World panel activated');
      },
      onDeactivate: () => {
        this.log('info', 'Hello World panel deactivated');
      },
    };

    this.panelHandle = ui.registerPanel(panelOptions);
  }

  private async setupMenu(ui: PluginAPI['ui']): Promise<void> {
    const menuOptions: MenuItemOptions = {
      id: 'hello-world-menu',
      label: 'Say Hello',
      menu: 'editor',
      shortcut: 'Cmd+Shift+H',
      action: async () => {
        await this.sayHello();
      },
    };

    this.menuHandle = ui.registerMenuItem(menuOptions);
  }

  private async setupEvents(events: PluginAPI['events']): Promise<void> {
    events.on('file:saved', async (data: any) => {
      this.log('info', `File saved: ${data.path}`);
      await this.onFileSaved(data.path);
    });

    events.on('editor:focus', async (data: any) => {
      this.log('debug', `Editor focused: ${data.fileId}`);
    });
  }

  private async setupAI(ai: PluginAPI['ai']): Promise<void> {
    const response = await ai.chat('Hello! How are you?', {
      model: 'gpt-4',
      stream: false,
    });

    for await (const message of response) {
      this.log('info', `AI Response: ${message}`);
    }
  }

  private async setupStorage(storage: PluginAPI['storage']): Promise<void> {
    const greeting = await storage.get('greeting', 'Hello');
    this.log('info', `Stored greeting: ${greeting}`);

    await storage.set('lastActivated', Date.now());
  }

  private async sayHello(): Promise<void> {
    const { ui, storage } = this.api;

    const greeting = await storage.get('greeting', 'Hello');
    const timestamp = new Date().toLocaleString();

    ui.showNotification({
      title: 'Hello World',
      message: `${greeting}! Time: ${timestamp}`,
      type: 'info',
      duration: 3000,
      actions: [
        {
          label: 'Dismiss',
          action: () => {
            this.log('info', 'Notification dismissed');
          },
        },
      ],
    });
  }

  private async onFileSaved(filePath: string): Promise<void> {
    const { storage } = this.api;

    const savedFiles = await storage.get<string[]>('savedFiles', []);
    savedFiles.push(filePath);
    await storage.set('savedFiles', savedFiles);

    this.log('info', `Total saved files: ${savedFiles.length}`);
  }

  private cleanupPanel(): void {
    if (this.panelHandle) {
      this.panelHandle();
      this.panelHandle = null;
    }
  }

  private cleanupMenu(): void {
    if (this.menuHandle) {
      this.menuHandle();
      this.menuHandle = null;
    }
  }
}

export const helloWorldPlugin = createPlugin(
  {
    name: 'hello-world',
    version: '1.0.0',
    description: 'A simple Hello World plugin demonstrating the Plugin SDK',
    author: 'YanYuCloudCube Team',
    license: 'MIT',
    homepage: 'https://github.com/YYC3-Family-AI',
    permissions: [
      'editor:read',
      'ui:panel',
      'ui:menu',
      'ui:statusbar',
      'ai:chat',
      'events:emit',
      'events:listen',
      'storage:read',
      'storage:write',
    ],
    activationEvents: ['onStartup'],
  },
  HelloWorldPlugin
);