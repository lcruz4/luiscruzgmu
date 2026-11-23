import type { Action } from '@/types/remorse';
import { applyAction, inCheck, legalMoves } from './engine';
import { TUTORIAL, tutorialStart } from './tutorialScript';

describe('tutorial script', () => {
  it('plays out legally with the scripted rolls', () => {
    let state = tutorialStart();
    const played: string[][] = [];
    for (const beat of TUTORIAL) {
      if (beat.kind === 'note') continue;
      expect(state.turn).toBe(beat.kind === 'you' ? 'w' : 'b');
      let action: Action;
      let roll: number | undefined;
      if ('heal' in beat) {
        const bishop = state.pieces.find((p) => p.square === beat.heal);
        if (!bishop) throw new Error(`No piece on ${beat.heal}`);
        action = { type: 'selfHeal', pieceId: bishop.id };
      } else {
        expect(legalMoves(state, beat.from)).toContain(beat.to);
        action = { type: 'move', from: beat.from, to: beat.to };
        roll = beat.roll;
      }
      const result = applyAction(state, action, () => {
        if (roll === undefined) throw new Error('Unexpected roll');
        return roll;
      });
      state = result.state;
      played.push(result.events.map((event) => event.type));
      // The devastated bishop lined up on the king never gives check
      if (played.length === 2) expect(inCheck(state, 'w')).toBe(false);
    }
    expect(played).toEqual([
      ['move', 'capture', 'roll'],
      ['move', 'capture', 'roll'],
      ['move', 'heal'],
      ['move'],
      ['move', 'capture', 'roll'],
      ['move'],
      ['heal'],
      ['move', 'death'],
      ['move', 'capture', 'roll', 'extraMove'],
      ['move', 'capture', 'kill'],
      ['move'],
      ['move', 'capture', 'bloodlust', 'extraMove'],
      ['move', 'capture', 'gameOver'],
    ]);
    expect(state.winner).toBe('w');
  });
});
