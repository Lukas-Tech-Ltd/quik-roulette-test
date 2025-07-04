import gsap, { Back } from 'gsap';
import {
  Assets,
  Container,
  ContainerOptions,
  EventEmitter,
  FederatedPointerEvent,
  Graphics,
  Point,
  Sprite,
  Text,
  TextStyle,
  Ticker,
} from 'pixi.js';

import { tableProps } from './table-props';
import { Wheel } from './wheel';
import { BetData } from '../schema/bet-schema';

export enum TableEventName {
  ADD_BET = 'add_bet',
  SPIN_STARTED = 'spin_started',
  SPIN_COMPLETE = 'spin_complete',
}

type TableEvent = {
  [TableEventName.ADD_BET]: (betLabel: string) => void;
  [TableEventName.SPIN_STARTED]: () => void;
  [TableEventName.SPIN_COMPLETE]: () => void;
};

export class Table extends Container {
  public readonly events: EventEmitter<TableEvent>;
  protected wheel: Wheel;
  protected board: Container;
  protected boardMask: Graphics;
  protected chipContainer: Container;

  constructor(opts?: Partial<ContainerOptions>) {
    super(opts);
    this.events = new EventEmitter();
    this.wheel = this.addChild(new Wheel({ label: 'Betting-Wheel' }));
    this.board = this.addChild(new Container({ label: 'Betting-Board' }));
  }

  public async init(ticker: Ticker): Promise<void> {
    this.wheel.init(ticker);
    this.createBettingBoard();
    this.createMask();
    this.setInteractionEnabled(false);
  }

  public async spinWheel(): Promise<void> {
    await this.wheel.spin();
    this.events.emit(TableEventName.SPIN_STARTED);
  }

  public async stopWheel(result: number = 0): Promise<void> {
    await this.wheel.stop(result);
    this.events.emit(TableEventName.SPIN_COMPLETE);
  }

  public async drawBets(currentBets: Map<string, BetData>): Promise<void> {
    this.clearBets();

    const staggerY = -3;
    currentBets.forEach((value: BetData) => {
      let offsetY = 0;
      for (let i = 0; i < value.amount; i++) {
        const point = this.getChipXY(value.position);

        const chipTexture = Assets.get('chip');
        const chipSprite = new Sprite(chipTexture);
        chipSprite.scale.set(0.65);
        chipSprite.position.set(point.x, point.y + offsetY);
        chipSprite.eventMode = 'none';
        this.chipContainer.addChild(chipSprite);

        offsetY += staggerY;
      }
    });
  }

  public clearBets(): void {
    this.chipContainer.removeChildren();
  }

  public unfocusBoard(): Promise<void> {
    return new Promise((resolve: () => void) => {
      gsap.to(this.board, {
        y: tableProps.board.unfocusedY,
        ease: Back.easeOut,
        onComplete: () => resolve(),
      });
    });
  }

  public focusBoard(): Promise<void> {
    return new Promise((resolve: () => void) => {
      gsap.to(this.board, {
        y: tableProps.board.y,
        ease: Back.easeOut,
        onComplete: () => resolve(),
      });
    });
  }

  public setInteractionEnabled(enabled: boolean = true): void {
    this.eventMode = enabled ? 'static' : 'none';
  }

  protected onCellClicked(event: FederatedPointerEvent): void {
    this.events.emit(TableEventName.ADD_BET, event.target.label);
  }

  protected getChipXY(position: string): Point {
    let x = 0,
      y = 0;
    if (/\D/.test(position)) {
      switch (position) {
        case '1st12':
          x = -45;
          y = 10;
          break;
        case '2nd12':
          x = -45;
          y = 150;
          break;
        case '3rd12':
          x = -45;
          y = 300;
          break;
        case '1to18':
          x = -90;
          y = 10;
          break;
        case 'EVEN':
          x = -90;
          y = 85;
          break;
        case 'RED':
          x = -90;
          y = 150;
          break;
        case 'BLACK':
          x = -90;
          y = 215;
          break;
        case 'ODD':
          x = -90;
          y = 290;
          break;
        case '19to36':
          x = -90;
          y = 365;
          break;
        case '2to1_0':
          x = 0;
          y = 438;
          break;
        case '2to1_1':
          x = 100;
          y = 438;
          break;
        case '2to1_2':
          x = 200;
          y = 438;
          break;
      }
    } else {
      let col, row;
      const pos = parseInt(position);
      if (pos === 0) {
        col = 1;
        row = -1;
      } else {
        col = (pos - 1) % 3;
        row = Math.floor((pos - 1) / 3);
      }

      x = col * tableProps.board.cellWidth;
      y = row * tableProps.board.cellHeight;
    }

    return new Point(x, y);
  }

  protected createBettingBoard(): void {
    this.board.x = tableProps.board.x;
    this.board.y = tableProps.board.unfocusedY;

    const cellW = tableProps.board.cellWidth;
    const cellH = tableProps.board.cellHeight;

    const labelStyle = new TextStyle(tableProps.board.lableStyle);
    const cellStyle = new TextStyle(tableProps.board.cellStyle);

    const zero = new Graphics();
    zero.rect(0, -cellH, cellW * 3, cellH);
    zero.fill(0x009900).stroke({ width: 2, color: 0xffffff });
    this.board.addChild(zero);

    zero.label = `0`;
    zero.eventMode = 'static';
    zero.cursor = 'pointer';
    zero.on('pointerup', (evt) => this.onCellClicked(evt));

    const zeroText = new Text({ text: '0', style: labelStyle });
    zeroText.x = cellW * 1.5 - zeroText.width / 2;
    zeroText.y = -cellH / 2 - zeroText.height / 2;
    zeroText.eventMode = 'none';
    this.board.addChild(zeroText);

    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 3; col++) {
        const number = row * 3 + col + 1;
        const isRed = tableProps.redNumbers.includes(number);
        const isBlack = tableProps.blackNumbers.includes(number);
        const fill = isRed
          ? tableProps.colors.red[0]
          : isBlack
          ? tableProps.colors.black[0]
          : tableProps.colors.green[0];

        const cell = new Graphics();
        cell.rect(col * cellW, 0 + row * cellH, cellW, cellH);
        cell.fill(fill).stroke({ width: 2, color: 0xffffff });
        this.board.addChild(cell);

        cell.label = `${number}`;
        cell.eventMode = 'static';
        cell.cursor = 'pointer';
        cell.on('pointerup', (evt) => this.onCellClicked(evt));

        const numText = new Text({
          text: number.toString(),
          style: labelStyle,
        });
        numText.x = col * cellW + cellW / 2 - numText.width / 2;
        numText.y = row * cellH + cellH / 2 - numText.height / 2;
        numText.eventMode = 'none';
        this.board.addChild(numText);
      }
    }

    for (let i = 0; i < 3; i++) {
      const y = 12 * cellH;
      const labelBox = new Graphics();
      labelBox.rect(i * cellW, y, cellW, cellH);
      labelBox.fill(0x333333).stroke({ width: 2, color: 0xffffff });
      this.board.addChild(labelBox);

      labelBox.label = `2to1_${i}`;
      labelBox.eventMode = 'static';
      labelBox.cursor = 'pointer';
      labelBox.on('pointerup', (evt) => this.onCellClicked(evt));

      const labelText = new Text({ text: '2 to 1', style: cellStyle });
      labelText.x = i * cellW + cellW / 2 - labelText.width / 2;
      labelText.y = y + cellH / 2 - labelText.height / 2;
      labelText.eventMode = 'none';
      this.board.addChild(labelText);
    }

    const smallCellW = cellW / 2;
    const dozenX = -smallCellW;
    const sideBetX = -smallCellW * 2;

    const dozenLabels = ['1st 12', '2nd 12', '3rd 12'];
    for (let i = 0; i < 3; i++) {
      const y = i * 4 * cellH;

      const labelBox = new Graphics();
      labelBox.rect(dozenX, y, smallCellW, cellH * 4);
      labelBox.fill(0x444444).stroke({ width: 2, color: 0xffffff });
      this.board.addChild(labelBox);

      labelBox.label = `${dozenLabels[i].replace(/\ /g, '')}`;
      labelBox.eventMode = 'static';
      labelBox.cursor = 'pointer';
      labelBox.on('pointerup', (evt) => this.onCellClicked(evt));

      const labelText = new Text({ text: dozenLabels[i], style: labelStyle });
      labelText.rotation = Math.PI / 2;
      labelText.anchor.set(0.5);
      labelText.x = dozenX + smallCellW / 2;
      labelText.y = y + 2 * cellH;
      labelText.eventMode = 'none';
      this.board.addChild(labelText);
    }

    const sideBets = ['1 to 18', 'EVEN', 'RED', 'BLACK', 'ODD', '19 to 36'];
    for (let i = 0; i < 6; i++) {
      const y = i * 2 * cellH;

      const labelBox = new Graphics();
      labelBox.rect(sideBetX, y, smallCellW, cellH * 2);
      labelBox.fill(0x555555).stroke({ width: 2, color: 0xffffff });
      this.board.addChild(labelBox);

      labelBox.label = `${sideBets[i].replace(/\ /g, '')}`;
      labelBox.eventMode = 'static';
      labelBox.cursor = 'pointer';
      labelBox.on('pointerup', (evt) => this.onCellClicked(evt));

      const text = sideBets[i].replace(/^RED$/, '🟥').replace(/^BLACK$/, '⬛️');

      const labelText = new Text({ text, style: labelStyle });
      labelText.rotation = Math.PI / 2;
      labelText.anchor.set(0.5);
      labelText.x = sideBetX + smallCellW / 2;
      labelText.y = y + cellH;
      labelText.eventMode = 'none';
      this.board.addChild(labelText);
    }

    this.chipContainer = new Container();
    this.board.addChild(this.chipContainer);
    this.chipContainer.eventMode = 'none';
  }

  protected createMask(): void {
    this.boardMask = new Graphics();
    this.boardMask.rect(0, 260, 500, 550);
    this.boardMask.fill({ color: 0x00ff00, alpha: 0.6 });
    this.addChild(this.boardMask);
    this.board.mask = this.boardMask;
  }
}
