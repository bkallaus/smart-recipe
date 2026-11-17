import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InputWithLabel, TextareaWithLabel } from './input-with-label';

describe('InputWithLabel', () => {
  afterEach(cleanup);

  it('associates the label with the input when no id is passed', () => {
    render(<InputWithLabel label='Recipe Name' name='name' />);
    const input = screen.getByLabelText('Recipe Name');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).not.toBe('');
  });

  it('keeps an explicit id', () => {
    render(<InputWithLabel label='Cuisine' id='cuisine-field' />);
    expect(screen.getByLabelText('Cuisine').id).toBe('cuisine-field');
  });

  it('gives each instance a distinct id', () => {
    render(
      <>
        <InputWithLabel label='First' />
        <InputWithLabel label='Second' />
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(
      screen.getByLabelText('Second').id,
    );
  });

  it('links the error text and marks the input invalid', () => {
    render(<InputWithLabel label='Recipe Name' error='Required' />);
    const input = screen.getByLabelText('Recipe Name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? '')?.textContent).toBe(
      'Required',
    );
  });

  it('does not mark a valid input invalid or leak label/error to the DOM', () => {
    render(<InputWithLabel label='Recipe Name' />);
    const input = screen.getByLabelText('Recipe Name');
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.hasAttribute('label')).toBe(false);
    expect(input.hasAttribute('error')).toBe(false);
  });
});

describe('TextareaWithLabel', () => {
  afterEach(cleanup);

  it('renders a labelled textarea', () => {
    render(<TextareaWithLabel label='Instructions' error='Too long' />);
    const textarea = screen.getByLabelText('Instructions');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });
});
