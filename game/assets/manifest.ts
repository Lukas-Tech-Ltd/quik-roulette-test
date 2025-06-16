import { AssetsManifest } from 'pixi.js';

export const assetManifest: AssetsManifest = {
  bundles: [
    {
      name: 'main',
      assets: [
        {
          alias: 'carpet',
          src: 'carpet.webp',
        },
        {
          alias: 'chip',
          src: 'chip.png',
        },
      ],
    },
  ],
};
