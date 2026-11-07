import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { logoutMock, pushMock, refreshMock, googleLogoutMock } = vi.hoisted(
  () => ({
    logoutMock: vi.fn(),
    pushMock: vi.fn(),
    refreshMock: vi.fn(),
    googleLogoutMock: vi.fn(),
  }),
);

vi.mock('@/server-actions/auth', () => ({ logout: logoutMock }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));
vi.mock('@react-oauth/google', () => ({ googleLogout: googleLogoutMock }));
// Render next/link as a plain anchor that doesn't trigger jsdom navigation.
vi.mock('next/link', () => ({
  default: ({
    href,
    onClick,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    />
  ),
}));

import HamburgerMenu from './hamburger-menu';

const openMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
};

describe('HamburgerMenu', () => {
  beforeEach(() => {
    logoutMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('toggles the menu open and closed', () => {
    render(<HamburgerMenu userName='Jane Cook' />);

    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Favorite recipes')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Jane Cook')).toBeTruthy();
    const panel = document.getElementById(
      toggle.getAttribute('aria-controls') ?? '',
    );
    expect(panel).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Favorite recipes')).toBeNull();
  });

  it('closes on Escape and on outside click', () => {
    render(<HamburgerMenu userName='Jane Cook' />);

    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Favorite recipes')).toBeNull();

    openMenu();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText('Favorite recipes')).toBeNull();
  });

  it('links to the favorites page and closes when selected', () => {
    render(<HamburgerMenu userName='Jane Cook' />);
    openMenu();

    const link = screen.getByRole('link', { name: /favorite recipes/i });
    expect(link.getAttribute('href')).toBe('/favorite');

    fireEvent.click(link);
    expect(
      screen.queryByRole('link', { name: /favorite recipes/i }),
    ).toBeNull();
  });

  it('logs out, disables Google auto-select and navigates home', async () => {
    render(<HamburgerMenu userName='Jane Cook' />);
    openMenu();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    });

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
    expect(googleLogoutMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/');
  });
});
