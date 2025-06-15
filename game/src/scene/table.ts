import gsap, { Back } from 'gsap';
import {
  Container,
  ContainerOptions,
  EventEmitter,
  FederatedPointerEvent,
  Graphics,
  Text,
  TextStyle,
  Ticker,
} from 'pixi.js';

import { tableProps } from './table-props';
import { Wheel } from './wheel';

export enum TableEventName {
  INCREASE_BET = 'place_bets',
  SPIN_COMPLETE = 'spin_complete',
}

type TableEvent = {
  [TableEventName.INCREASE_BET]: (betLabel: string) => void;
  [TableEventName.SPIN_COMPLETE]: () => void;
};

export class Table extends Container {
  public readonly events: EventEmitter<TableEvent>;
  protected wheel: Wheel;
  protected board: Container;
  protected boardMask: Graphics;

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
    this.setInteraction(false);
  }

  public async spinWheel(): Promise<void> {
    await this.wheel.spin();
    this.events.emit(TableEventName.SPIN_COMPLETE);
  }

  public unfocusBoard(): Promise<void> {
    return new Promise((resolve: () => void) => {
      gsap.to(this.board, {
        y: tableProps.board.unfocusedY,
        duration: 1,
        ease: Back.easeOut,
        onComplete: () => resolve(),
      });
    });
  }

  public focusBoard(): Promise<void> {
    return new Promise((resolve: () => void) => {
      gsap.to(this.board, {
        y: tableProps.board.y,
        duration: 1,
        ease: Back.easeOut,
        onComplete: () => resolve(),
      });
    });
  }

  public setInteraction(enabled: boolean = true): void {
    this.eventMode = enabled ? 'static' : 'none';
  }

  protected onCellClicked(event: FederatedPointerEvent): void {
    this.events.emit(TableEventName.INCREASE_BET, event.target.label);
  }

  protected createBettingBoard(): void {
    this.board.x = tableProps.board.x;
    this.board.y = tableProps.board.y;

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
      this.board.addChild(labelText);
    }
  }

  protected createMask(): void {
    this.boardMask = new Graphics();
    this.boardMask.rect(0, 260, 500, 550);
    this.boardMask.fill({ color: 0x00ff00, alpha: 0.6 });
    this.addChild(this.boardMask);
    this.board.mask = this.boardMask;
  }
}
