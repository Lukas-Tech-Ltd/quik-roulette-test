import EventEmitter from 'node:events';
import TypedEmitter from 'typed-emitter';
import { QuickGameState, QuickGameStateEvent } from '../schema/state-schema';
import { wrappedIndex } from '../utils/array';

type StateEvents = {
  [QuickGameStateEvent.ENTER]: (state: QuickGameState) => void;
  [QuickGameStateEvent.EXIT]: (state: QuickGameState) => void;
};

export class QuickGameStateMachine {
  public readonly events: EventEmitter;
  protected states: QuickGameState[];
  protected stateIndex: number;

  constructor(states: QuickGameState[]) {
    this.states = states;
    this.events = new EventEmitter() as TypedEmitter<StateEvents>;
  }

  public init(stateIndex: number = 0): void {
    this.stateIndex = wrappedIndex(stateIndex, this.states.length);
    const initState = this.currentState();
    this.events.emit(QuickGameStateEvent.ENTER, initState);
  }

  public nextState(): void {
    const exitState = this.currentState();
    this.events.emit(QuickGameStateEvent.EXIT, exitState);

    this.stateIndex = wrappedIndex(this.stateIndex + 1, this.states.length);

    const enterState = this.currentState();
    this.events.emit(QuickGameStateEvent.ENTER, enterState);
  }

  public currentState(): QuickGameState {
    return this.states[this.stateIndex];
  }
}
