import {
  MoveClassification,
  Analysis,
} from '../types/chess';
import { stockfishService } from '../services/stockfish';

describe('Stockfish Service', () => {
  afterAll(async () => {
    stockfishService.killAllInstances();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Service Management', () => {
    it('should be a singleton', () => {
      const instance1 = stockfishService;
      const instance2 = stockfishService;
      expect(instance1).toBe(instance2);
    });

    it('should handle empty PGN gracefully', async () => {
      const result = await stockfishService.analyzeGame('');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should manage instance pool correctly', async () => {
      const initialCount = stockfishService.getInstanceCount();
      await stockfishService.analyzeGame('1. e4');
      const afterAnalysisCount = stockfishService.getInstanceCount();
      expect(afterAnalysisCount).toBeGreaterThan(initialCount);
      stockfishService.killAllInstances();
      const afterCleanupCount = stockfishService.getInstanceCount();
      expect(afterCleanupCount).toBe(0);
    });
  });

  describe('Game Analysis', () => {
    it('should analyze a simple game', async () => {
      const testPgn = '1. e4 e5';
      const result = await stockfishService.analyzeGame(testPgn);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      result.forEach((analysis: Analysis) => {
        expect(analysis.move).toBeDefined();
        expect(analysis.turn).toBeDefined();
        expect(analysis.bestMove).toBeDefined();
        expect(analysis.eval).toBeDefined();
        expect(analysis.eval.depth).toBeGreaterThan(0);
        expect(typeof analysis.eval.win).toBe('number');
        expect(typeof analysis.eval.draw).toBe('number');
        expect(typeof analysis.eval.lose).toBe('number');
        expect(Array.isArray(analysis.eval.lines)).toBe(true);
        expect(Object.values(MoveClassification)).toContain(analysis.classificationStockfishWDL);
        expect(Object.values(MoveClassification)).toContain(analysis.classificationLichessFormula);
        expect(Object.values(MoveClassification)).toContain(analysis.classificationStandardLogisticFormula);
      });
    }, 30000);

    it('should handle Scholar\'s Mate blunder correctly', async () => {
      const scholarsMate = '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6';
      const result = await stockfishService.analyzeGame(scholarsMate);
      expect(result.length).toBe(6);
      const nf6Move = result.find(analysis => analysis.move.includes('Nf6'));
      expect(nf6Move).toBeDefined();
      if (nf6Move) {
        expect(nf6Move.classificationStockfishWDL).toBe(MoveClassification.BLUNDER);
      }
    }, 60000);

    it('should handle invalid PGN gracefully', async () => {
      const invalidPgn = '1. e4 e5 2. Nf3 invalid_move';
      await expect(stockfishService.analyzeGame(invalidPgn)).rejects.toThrow();
    });
  });

  xdescribe('Concurrent Analysis and Locking', () => {
    it('should handle concurrent analyses without conflicts', async () => {
      const games = ['1. e4 e5', '1. d4 d5', '1. Nf3 Nf6'];
      const promises = games.map(pgn => stockfishService.analyzeGame(pgn));
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0].move).toContain('1.');
      });
    }, 90000);

    it('should properly queue requests when pool is full', async () => {
      stockfishService.killAllInstances();
      const startTime = Date.now();
      const manyGames = Array(8).fill(0).map((_, i) => `1. e4 e5 2. Nf3 Nc6`);
      const promises = manyGames.map(pgn => stockfishService.analyzeGame(pgn));
      const results = await Promise.all(promises);
      const endTime = Date.now();
      expect(results).toHaveLength(8);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(4);
      });
      expect(endTime - startTime).toBeLessThan(300000);
    }, 300000);

    it('should maintain data consistency across concurrent analyses', async () => {
      const samePgn = '1. e4 e5 2. Nf3';
      const promises = Array(5).fill(0).map(() => stockfishService.analyzeGame(samePgn));
      const results = await Promise.all(promises);
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result.length).toBe(firstResult.length);
        for (let i = 0; i < result.length; i++) {
          expect(result[i].move).toBe(firstResult[i].move);
          expect(result[i].eval.depth).toBe(firstResult[i].eval.depth);
          expect(typeof result[i].eval.win).toBe('number');
          expect(typeof result[i].eval.draw).toBe('number');
          expect(typeof result[i].eval.lose).toBe('number');
        }
      });
    }, 120000);

    it('should handle instance creation under concurrent load', async () => {
      stockfishService.killAllInstances();
      expect(stockfishService.getInstanceCount()).toBe(0);
      const games = Array(3).fill(0).map((_, i) => `1. ${i % 2 === 0 ? 'e4' : 'd4'} ${i % 2 === 0 ? 'e5' : 'd5'}`);
      const promises = games.map(pgn => stockfishService.analyzeGame(pgn));
      await Promise.all(promises);
      expect(stockfishService.getInstanceCount()).toBeGreaterThan(0);
      expect(stockfishService.getInstanceCount()).toBeLessThanOrEqual(5);
    }, 90000);
  });

  xdescribe('Performance and Caching', () => {
    it('should leverage caching for repeated positions', async () => {
      const pgn = '1. e4 e5 2. Nf3 Nc6';
      const start1 = Date.now();
      const result1 = await stockfishService.analyzeGame(pgn);
      const time1 = Date.now() - start1;
      const start2 = Date.now();
      const result2 = await stockfishService.analyzeGame(pgn);
      const time2 = Date.now() - start2;
      expect(result1.length).toBe(result2.length);
      expect(result1[0].move).toBe(result2[0].move);
      expect(time2).toBeLessThan(30000);
    }, 60000);

    it('should handle complex games efficiently', async () => {
      const complexGame = `
        1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7
        6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8
      `.replace(/\s+/g, ' ').trim();
      const startTime = Date.now();
      const result = await stockfishService.analyzeGame(complexGame);
      const endTime = Date.now();
      expect(result.length).toBe(18);
      expect(endTime - startTime).toBeLessThan(180000);
      expect(result[0].move).toBe('1. e4');
      expect(result[1].move).toBe('1... e5');
      expect(result[17].move).toBe('9... Nb8');
    }, 180000);
  });
});