import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { logoutMock, pushMock, refreshMock, googleLogoutMock } = vi.hoisted(
  () => ({
    logoutMock: vi.fn(async () => {}),
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    googleLogoutMock: vi.fn(),
  }),
);

vi.mock('@/server-actions/logout', () => ({ logout: logoutMock }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock('@react-oauth/google', () => ({ googleLogout: googleLogoutMock }));

import HamburgerMenu from './hamburger-menu';

describe('HamburgerMenu', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('toggles open and closed', () => {
    render(<HamburgerMenu userName='Ada' />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Log out')).toBeNull();

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Log out')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();

    fireEvent.click(button);
    expect(screen.queryByText('Log out')).toBeNull();
  });

  it('closes on Escape and outside click', () => {
    render(<HamburgerMenu />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Log out')).toBeNull();

    fireEvent.click(button);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Log out')).toBeNull();
  });

  it('links to the favorites page and closes on click', () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const link = screen.getByRole('link', { name: /favorite recipes/i });
    expect(link.getAttribute('href')).toBe('/favorite');
    fireEvent.click(link);
    expect(
      screen.queryByRole('link', { name: /favorite recipes/i }),
    ).toBeNull();
  });

  it('calls the logout action and refreshes', async () => {
    render(<HamburgerMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(googleLogoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
