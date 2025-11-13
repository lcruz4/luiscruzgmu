import { Analysis, stockfishService } from '../../utils/chess';

export const ChessReview = ({ review }: { review: Analysis[] }) => {
  return (
    <div>
      <h1>Chess Review</h1>
      <pre>{review.map(r => `${r.move}: ${r.classification}`).join('\n')}</pre>
      <h1>Full Review</h1>
      <pre>{JSON.stringify(review, null, 2)}</pre>
    </div>
  );
};

export default ChessReview;

export const getServerSideProps = async () => {
  const review = await stockfishService.analyzeGame('[Event \"Live Chess\"]\n[Site \"Chess.com\"]\n[Date \"2025.11.01\"]\n[Round \"-\"]\n[White \"stano_a\"]\n[Black \"kayzingzingy\"]\n[Result \"0-1\"]\n[CurrentPosition \"7k/6pp/p7/5p2/1P2rP2/P2qn3/Q4BPP/4R1K1 w - - 4 31\"]\n[Timezone \"UTC\"]\n[ECO \"B10\"]\n[ECOUrl \"https://www.chess.com/openings/Caro-Kann-Defense-Accelerated-Panov-Attack-2...d5-3.exd5-cxd5-4.cxd5\"]\n[UTCDate \"2025.11.01\"]\n[UTCTime \"14:48:35\"]\n[WhiteElo \"671\"]\n[BlackElo \"728\"]\n[TimeControl \"120+1\"]\n[Termination \"kayzingzingy won on time\"]\n[StartTime \"14:48:35\"]\n[EndDate \"2025.11.01\"]\n[EndTime \"14:53:36\"]\n[Link \"https://www.chess.com/game/live/144993779370\"]\n\n1. e4 {[%clk 0:01:59.5]} 1... c6 {[%clk 0:02:00.8]} 2. c4 {[%clk 0:01:59]} 2... d5 {[%clk 0:02:01.7]} 3. cxd5 {[%clk 0:01:59.6]} 3... cxd5 {[%clk 0:02:01.7]} 4. exd5 {[%clk 0:02:00.5]} 4... e5 {[%clk 0:02:00.8]} 5. Nc3 {[%clk 0:02:01.1]} 5... Nf6 {[%clk 0:01:56.4]} 6. Bc4 {[%clk 0:02:00.1]} 6... Bd6 {[%clk 0:01:53.3]} 7. Nge2 {[%clk 0:01:52.4]} 7... O-O {[%clk 0:01:49]} 8. O-O {[%clk 0:01:52]} 8... Bd7 {[%clk 0:01:48]} 9. Ng3 {[%clk 0:01:46.5]} 9... b5 {[%clk 0:01:46.1]} 10. Nxb5 {[%clk 0:01:37.5]} 10... Bb4 {[%clk 0:01:34]} 11. a3 {[%clk 0:01:33.3]} 11... Bc5 {[%clk 0:01:33.2]} 12. b4 {[%clk 0:01:32.4]} 12... Bb6 {[%clk 0:01:31.1]} 13. d3 {[%clk 0:01:25.2]} 13... a6 {[%clk 0:01:30.4]} 14. Nc3 {[%clk 0:01:19.5]} 14... Bd4 {[%clk 0:01:24.9]} 15. Bb2 {[%clk 0:01:15.9]} 15... Bb5 {[%clk 0:01:21.2]} 16. Nge2 {[%clk 0:01:07.3]} 16... Bxc3 {[%clk 0:01:10.7]} 17. Bxc3 {[%clk 0:01:06.5]} 17... Nxd5 {[%clk 0:00:57.9]} 18. Bxe5 {[%clk 0:00:57.8]} 18... Nc6 {[%clk 0:00:47.4]} 19. Bg3 {[%clk 0:00:39]} 19... f5 {[%clk 0:00:42.8]} 20. Qb3 {[%clk 0:00:31.6]} 20... Ne7 {[%clk 0:00:37.6]} 21. Nf4 {[%clk 0:00:18]} 21... Bxc4 {[%clk 0:00:35.4]} 22. Qxc4 {[%clk 0:00:15.5]} 22... Rc8 {[%clk 0:00:28]} 23. Qb3 {[%clk 0:00:14.9]} 23... Kh8 {[%clk 0:00:22.4]} 24. Nxd5 {[%clk 0:00:10.2]} 24... Nxd5 {[%clk 0:00:21]} 25. f4 {[%clk 0:00:09.4]} 25... Rc3 {[%clk 0:00:19]} 26. Qa2 {[%clk 0:00:08.9]} 26... Rxd3 {[%clk 0:00:17.5]} 27. Rfd1 {[%clk 0:00:08.2]} 27... Ne3 {[%clk 0:00:15.5]} 28. Rxd3 {[%clk 0:00:06.9]} 28... Qxd3 {[%clk 0:00:16.4]} 29. Re1 {[%clk 0:00:03.1]} 29... Re8 {[%clk 0:00:14.4]} 30. Bf2 {[%clk 0:00:01.4]} 30... Re4 {[%clk 0:00:10.5]} 0-1\n');

  return {
    props: {
      review,
    },
  };
}