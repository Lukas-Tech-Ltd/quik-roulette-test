import { Application, ApplicationOptions, Assets } from 'pixi.js';

import { Table, TableEventName } from './scene/table';
import { UI, UIEventName } from './scene/ui';

import { assetManifest } from '../assets/manifest';
import './style.css';
import { Background } from './scene/background';

export class Game {
  protected pixiApp: Application;
  protected background: Background;
  protected table: Table;
  protected ui: UI;

  constructor() {
    this.pixiApp = new Application();
    this.background = new Background();
    this.table = new Table();
    this.ui = new UI();
  }

  public async init(): Promise<void> {
    console.log(`[Game] init`);
    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    const appOptions: Partial<ApplicationOptions> = {
      canvas,
      resizeTo: window,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: 0x1b1b1b,
    };
    this.pixiApp = new Application();

    await this.pixiApp.init(appOptions);
    await this.loadAssets();
    await this.createScene();
  }

  protected async createScene(): Promise<void> {
    await this.background.init();
    await this.table.init();
    await this.ui.init();

    this.pixiApp.stage.addChild(this.background);
    this.pixiApp.stage.addChild(this.table);
    this.pixiApp.stage.addChild(this.ui);

    this.table.events.on(TableEventName.INCREASE_BET, () => {
      console.log(`Lukas - on INCREASE_BET`);
    });

    this.ui.events.on(UIEventName.PLACE_BETS, () => {
      console.log(`Lukas - on PLACE_BETS`);
    });

    this.ui.events.on(UIEventName.CLEAR_BETS, () => {
      console.log(`Lukas - on CLEAR_BETS`);
    });
  }

  protected async loadAssets(): Promise<void> {
    Assets.init({ basePath: '/assets/', manifest: assetManifest });
    await Assets.loadBundle('main');
  }
}

await new Game().init();
