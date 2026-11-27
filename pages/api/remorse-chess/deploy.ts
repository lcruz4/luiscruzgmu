import { isDeploying } from '@/services/deployStatus';
import { remorseRoute } from '@/services/remorseApi';
import { addDeployWaiter, isDeployWaiter } from '@/services/remorseDeploy';

// GET: whether a deploy is blocking live games, and whether you'll get a push
// when it's done. POST: get that push.
export default remorseRoute({
  GET: async (_req, email) => {
    const deploying = await isDeploying();
    return {
      deploying,
      notifying: deploying && (await isDeployWaiter(email)),
    };
  },
  POST: async (_req, email) => {
    const deploying = await isDeploying();
    if (deploying) await addDeployWaiter(email);
    return { deploying, notifying: deploying };
  },
});
