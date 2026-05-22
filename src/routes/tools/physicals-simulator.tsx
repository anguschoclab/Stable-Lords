import { createFileRoute } from '@tanstack/react-router';
import PhysicalsSimulator from '@/pages/PhysicalsSimulator';/**
 * Route.
 */


export const Route = createFileRoute('/tools/physicals-simulator')({
  component: PhysicalsSimulator,
});
