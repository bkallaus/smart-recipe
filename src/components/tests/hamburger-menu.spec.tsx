import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { replace, refresh, logoutMock, disableMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  logoutMock: vi.fn(async () => {}),
  disableMock: vi.fn(async () => {}),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, refresh }),
}));

vi.mock('@/server-actions/logout', () => ({
  logout: () => logoutMock(),
}));

vi.mock('@/lib/google-auto-select', () => ({
  disableGoogleAutoSelect: () => disableMock(),
}));

import HamburgerMenu from '@/components/hamburger-menu';

const getToggle = () => screen.getByRole('button', { name: 'Main menu' });

describe('HamburgerMenu', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('toggles the panel open and closed', () => {
    render(<HamburgerMenu />);

    expect(getToggle().getAttribute('aria-expanded')).toBe('false');
    expect(
      screen.queryByRole('link', { name: /favorite recipes/i }),
    ).toBeNull();

    fireEvent.click(getToggle());
    expect(getToggle().getAttribute('aria-expanded')).toBe('true');
    expect(
      screen.getByRole('link', { name: /favorite recipes/i }),
    ).toBeTruthy();

    fireEvent.click(getToggle());
    expect(getToggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('links to the favorites page and closes when it is selected', () => {
    render(<HamburgerMenu />);

    fireEvent.click(getToggle());
    const link = screen.getByRole('link', { name: /favorite recipes/i });
    expect(link.getAttribute('href')).toBe('/favorite');

    // Stop jsdom from attempting a real navigation on the anchor click.
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(getToggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and on outside click', () => {
    render(<HamburgerMenu />);

    fireEvent.click(getToggle());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getToggle().getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(getToggle());
    fireEvent.pointerDown(document.body);
    expect(getToggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('logs out and navigates home with a refresh', async () => {
    render(<HamburgerMenu />);

    fireEvent.click(getToggle());
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(disableMock).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/');
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
