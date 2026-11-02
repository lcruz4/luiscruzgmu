import { DefaultsManager } from '@/components/giant-order/DefaultsManager';
import { GiantLayout } from '@/components/giant-order/GiantLayout';
import { requireGiantLogin } from '@/services/giantOrder';

const GiantDefaultsPage = () => (
  <GiantLayout>
    <DefaultsManager />
  </GiantLayout>
);

export const getServerSideProps = requireGiantLogin;

export default GiantDefaultsPage;
