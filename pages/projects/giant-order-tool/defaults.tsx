import { DefaultsManager } from '@/components/giant-order/DefaultsManager';
import { GiantLayout } from '@/components/giant-order/GiantLayout';
import { requireLogin } from '@/services/auth';

const GiantDefaultsPage = () => (
  <GiantLayout>
    <DefaultsManager />
  </GiantLayout>
);

export const getServerSideProps = requireLogin('giant-order-tool');

export default GiantDefaultsPage;
