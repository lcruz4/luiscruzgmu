import { bodyOf, intField } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import { addAppStoreClicks } from '@/services/remorseDb';

// Body { clicks }: taps on "I'd download it" since the last send. Adds the
// player to the App Store interest list; answers { count, clicks }
export default remorseRoute({
  POST: (req, email) =>
    addAppStoreClicks(email, intField(bodyOf(req).clicks, 'clicks', 1, 100)),
});
