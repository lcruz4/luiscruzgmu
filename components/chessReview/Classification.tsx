import { MoveClassification } from '../../types/chess';
import { Best, Blunder, Excellent, Good, Inaccuracy, Mistake } from '../icons';

export const Classification = ({ classification }: { classification: MoveClassification }) => {
  switch (classification) {
    case MoveClassification.BEST:
      return <Best />;
    case MoveClassification.EXCELLENT:
      return <Excellent />;
    case MoveClassification.GOOD:
      return <Good />;
    case MoveClassification.INACCURACY:
      return <Inaccuracy />;
    case MoveClassification.MISTAKE:
      return <Mistake />;
    case MoveClassification.BLUNDER:
      return <Blunder />;
    default:
      return null;
  }
}