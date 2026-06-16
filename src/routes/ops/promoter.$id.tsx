import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/promoter/$id')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/stable/promoter/$id', params });
  },
  component: () => null,
});
