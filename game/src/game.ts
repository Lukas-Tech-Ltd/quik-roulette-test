import { Application, ApplicationOptions, Assets } from 'pixi.js';

import { Table, TableEventName } from './scene/table';
import { UI, UIEventName } from './scene/ui';
import { assetManifest } from '../assets/manifest';
import { Background } from './scene/background';

import './style.css';
import { io, Socket } from 'socket.io-client';
import { BetData } from './schema/bet-schema';

export class Game {
  protected pixiApp: Application;
  protected sessionToken: string;
  protected socket: Socket;
  protected background: Background;
  protected table: Table;
  protected ui: UI;
  protected currentBets: Map<string, BetData>;
  protected userId: string;
  protected readyState: { spinStarted: boolean; resultReady: boolean } = {
    spinStarted: false,
    resultReady: false,
  };

  constructor() {
    this.pixiApp = new Application();
    this.background = new Background();
    this.table = new Table();
    this.ui = new UI();
    this.currentBets = new Map();
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
    await this.login();

    this.createEventHandlers();

    await this.table.focusBoard();
    this.table.setInteractionEnabled();
  }

  protected async login(): Promise<void> {
    return new Promise((resolve: () => void) => {
      const searchParams = new URLSearchParams(window.location.search);
      this.userId =
        searchParams.get('userId')?.replace(/\/$/, '') || 'LukasTech';
      const pass =
        searchParams.get('pass')?.replace(/\/$/, '') ||
        'MySuperSecurePassword123';

      this.socket = io(`http://localhost:3000`, {
        transports: ['websocket'],
        auth: {
          userId: this.userId,
          pass,
        },
      });

      this.socket.on('connect', () => {
        resolve();
      });
    });
  }

  protected createEventHandlers(): void {
    this.socket.on('message', (packet) => {
      console.log(`[Client] Message from game server`, packet);
      if (packet.event === 'connected') {
        this.sessionToken = packet.data.sessionToken;
      }

      if (packet.event === 'message') {
        console.log(`[Client] message`, packet);
      }

      if (packet.event === 'result_ready') {
        console.log(`[Client] result_ready`, packet);
        this.readyState.resultReady = true;
        this.checkReadyAndSendForResult();
      }

      if (packet.event === 'result') {
        console.log(`[Client] result`, packet);
        const { result } = packet.data;
        this.table.stopWheel(result.result);
      }

      if (packet.event === 'state') {
        const { data } = packet;
        if (data.state === 'idle') {
          console.log(`[Client] result`, packet);
          this.readyState.resultReady = false;
          this.readyState.spinStarted = false;
          this.table.focusBoard();
          this.table.setInteractionEnabled();
        }
      }
    });

    this.table.events.on(TableEventName.ADD_BET, (label: string) => {
      const existingBetData = this.currentBets.get(label);
      if (existingBetData) {
        existingBetData.amount += 1;
      } else {
        this.currentBets.set(label, {
          position: label,
          amount: 1,
        });
      }
    });

    this.table.events.on(TableEventName.SPIN_STARTED, () => {
      console.log(`Lukas - on SPIN_STARTED`);
      this.readyState.spinStarted = true;
      this.checkReadyAndSendForResult();
    });

    this.table.events.on(TableEventName.SPIN_COMPLETE, () => {
      console.log(`Lukas - on SPIN_COMPLETE`);
      const idleData = {
        event: 'idle',
        sessionToken: this.sessionToken,
      };
      this.socket.emit('message', idleData);
    });

    this.ui.events.on(UIEventName.PLACE_BETS, () => {
      if (this.currentBets.size > 0) {
        this.table.unfocusBoard();
        this.table.setInteractionEnabled(false);

        const bets = [...this.currentBets.entries()];
        const betEventData = {
          event: 'bet',
          bets,
          sessionToken: this.sessionToken,
          id: this.userId,
        };

        console.log(`[Client] send this data`, betEventData);
        this.socket.emit('message', betEventData);
        this.table.spinWheel();
      }
    });

    this.ui.events.on(UIEventName.CLEAR_BETS, () => {
      console.log(`Lukas - on CLEAR_BETS`);
      this.table.focusBoard();
    });
  }

  protected checkReadyAndSendForResult(): void {
    if (this.readyState.resultReady && this.readyState.spinStarted) {
      const readyForResultData = {
        event: 'ready_for_result',
        sessionToken: this.sessionToken,
      };
      this.socket.emit('message', readyForResultData);
    }
  }

  protected async createScene(): Promise<void> {
    await this.background.init();
    await this.table.init(this.pixiApp.ticker);
    await this.ui.init();

    this.pixiApp.stage.addChild(this.background, this.table, this.ui);
  }

  protected async loadAssets(): Promise<void> {
    Assets.init({ basePath: '/assets/', manifest: assetManifest });
    await Assets.loadBundle('main');
  }
}

await new Game().init();
