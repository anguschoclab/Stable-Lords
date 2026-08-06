import * as React from 'react';
import { useId } from 'react';
import { render } from '@testing-library/react';

// just checking if we can useId
function TestComponent() {
  const id = useId();
  return <div id={id}>Test</div>;
}

render(<TestComponent />);
