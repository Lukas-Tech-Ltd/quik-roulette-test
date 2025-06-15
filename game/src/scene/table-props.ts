export const tableProps = {
  redNumbers: [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ],
  blackNumbers: [
    2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
  ],
  colors: {
    red: [0x772222, 0x551818],
    black: [0x222222, 0x111111],
    green: [0x115511, 0x0d3f0d],
  },
  wheel: {
    x: 250,
    y: 250,
    radius: 220,
    scale: {
      x: 0.75,
      y: 0.75,
    },
    speed: {
      idle: 0.15,
      spinning: 10,
    },
    duration: {
      start: 1,
      wait: 5,
      stop: 20,
    },
  },
  board: {
    x: 145,
    y: 320,
    unfocusedY: 540,
    cellHeight: 36,
    cellWidth: 100,
    cellStyle: {
      fill: 'white',
      fontSize: 18,
      fontFamily: 'Arial',
    },
    lableStyle: {
      fill: 'white',
      fontSize: 16,
      fontFamily: 'Arial',
    },
  },
};
