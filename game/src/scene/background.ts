import { Assets, Container, TilingSprite } from 'pixi.js';

export class Background extends Container {
  public async init(): Promise<void> {
    const carpet = Assets.get('carpet');

    const carpetTiles = new TilingSprite({
      texture: carpet,
      tileScale: { x: 0.5, y: 0.5 },
      width: 500,
      height: 1000,
    });

    carpetTiles.blendMode = 'multiply';

    this.addChild(carpetTiles);
  }
}
