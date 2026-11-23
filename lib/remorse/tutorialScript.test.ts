import { applyAction, legalMoves } from './engine';
import { TUTORIAL, tutorialStart } from './tutorialScript';

describe('tutorial script', () => {
  it('plays out legally with the scripted rolls', () => {
    let state = tutorialStart();
    const types: string[] = [];
    for (const beat of TUTORIAL) {
      if (beat.kind === 'note') continue;
      expect(state.turn).toBe(beat.kind === 'you' ? 'w' : 'b');
      expect(legalMoves(state, beat.from)).toContain(beat.to);
      const result = applyAction(
        state,
        { type: 'move', from: beat.from, to: beat.to },
        () => {
          if (beat.roll === undefined) throw new Error('Unexpected roll');
          return beat.roll;
        },
      );
      state = result.state;
      types.push(...result.events.map((event) => event.type));
    }
    expect(types).toEqual([
      'move',
      'capture',
      'roll',
      'move',
      'move',
      'heal',
      'move',
      'capture',
      'roll',
      'move',
      'capture',
      'roll',
      'extraMove',
      'move',
      'capture',
      'kill',
      'move',
      'move',
      'capture',
      'bloodlust',
      'extraMove',
      'move',
      'capture',
      'gameOver',
    ]);
    expect(state.winner).toBe('w');
  });
});
