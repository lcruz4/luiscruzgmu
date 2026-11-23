import { bodyOf, HttpError, NO_CONTENT, objectField } from '@/services/api';
import { remorseRoute } from '@/services/remorseApi';
import {
  deletePushSubscription,
  savePushSubscription,
  vapidPublicKey,
} from '@/services/remorsePush';

const stringOf = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !value || value.length > 2000) {
    throw new HttpError(400, `${name} must be text`);
  }
  return value;
};

// GET: the VAPID public key (null while push isn't set up)
// POST: a PushSubscription's JSON · DELETE: { endpoint }
export default remorseRoute({
  GET: async () => ({ publicKey: vapidPublicKey() }),
  POST: async (req, email) => {
    const body = bodyOf(req);
    const endpoint = stringOf(body.endpoint, 'endpoint');
    if (!endpoint.startsWith('https://')) {
      throw new HttpError(400, 'endpoint must be https');
    }
    const keys = objectField(body.keys, 'keys');
    await savePushSubscription(
      email,
      endpoint,
      stringOf(keys.p256dh, 'keys.p256dh'),
      stringOf(keys.auth, 'keys.auth'),
    );
    return NO_CONTENT;
  },
  DELETE: async (req, email) => {
    await deletePushSubscription(
      email,
      stringOf(bodyOf(req).endpoint, 'endpoint'),
    );
    return NO_CONTENT;
  },
});
