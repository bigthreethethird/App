import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('landing page', () => {
  it('renders without crashing', () => { render(<Home />); expect(screen.getByRole('main')).toBeInTheDocument(); });
  it('shows the hero story statement', () => { render(<Home />); expect(screen.getByRole('heading', { name: /Every product has a story/i })).toBeInTheDocument(); });
});
