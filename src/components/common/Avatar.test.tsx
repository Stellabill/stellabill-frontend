import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar, type AvatarSize } from './Avatar';
import { getAvatarGradient, getInitials } from '../../utils/avatar';

describe('Avatar', () => {
  it('renders an <img> with the default alt text when src is provided', () => {
    render(<Avatar name="Ada Lovelace" src="https://example.com/ada.png" />);

    const img = screen.getByRole('img', { name: 'Ada Lovelace avatar' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', 'https://example.com/ada.png');
    expect(img).toHaveAttribute('alt', 'Ada Lovelace avatar');
  });

  it('uses custom alt text to override the default label on both image and fallback', () => {
    const { rerender } = render(
      <Avatar
        name="Ada Lovelace"
        src="https://example.com/ada.png"
        alt="Profile picture of Ada"
      />,
    );

    const img = screen.getByRole('img', { name: 'Profile picture of Ada' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('alt', 'Profile picture of Ada');

    rerender(<Avatar name="Ada Lovelace" alt="Profile picture of Ada" />);

    const fallback = screen.getByRole('img', { name: 'Profile picture of Ada' });
    expect(fallback.tagName).toBe('DIV');
    expect(fallback).toHaveAttribute('aria-label', 'Profile picture of Ada');
    expect(fallback).toHaveTextContent(getInitials('Ada Lovelace'));
  });

  it('renders initials on a deterministic gradient when src is omitted or null', () => {
    const name = 'Grace Hopper';
    const [start, end] = getAvatarGradient(name);

    const { rerender } = render(<Avatar name={name} />);

    let fallback = screen.getByRole('img', { name: `${name} avatar` });
    expect(fallback.tagName).toBe('DIV');
    expect(fallback).toHaveTextContent(getInitials(name));
    expect(fallback).toHaveStyle({
      background: `linear-gradient(135deg, ${start}, ${end})`,
    });

    rerender(<Avatar name={name} src={null} />);

    fallback = screen.getByRole('img', { name: `${name} avatar` });
    expect(fallback.tagName).toBe('DIV');
    expect(fallback).toHaveTextContent(getInitials(name));
  });

  it('swaps to initials fallback with role="img" when the image fails to load', () => {
    const name = 'Alan Turing';
    render(<Avatar name={name} src="https://example.com/broken.png" />);

    const img = screen.getByRole('img', { name: `${name} avatar` });
    expect(img.tagName).toBe('IMG');

    fireEvent.error(img);

    const fallback = screen.getByRole('img', { name: `${name} avatar` });
    expect(fallback.tagName).toBe('DIV');
    expect(fallback).toHaveTextContent(getInitials(name));
    expect(fallback).toHaveAttribute('aria-label', `${name} avatar`);
  });

  it('retries rendering the image when src changes after an error', () => {
    const name = 'Katherine Johnson';
    const { rerender } = render(
      <Avatar name={name} src="https://example.com/broken.png" />,
    );

    fireEvent.error(screen.getByRole('img', { name: `${name} avatar` }));
    expect(screen.getByRole('img', { name: `${name} avatar` }).tagName).toBe('DIV');

    rerender(<Avatar name={name} src="https://example.com/recovered.png" />);

    const img = screen.getByRole('img', { name: `${name} avatar` });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', 'https://example.com/recovered.png');
  });

  it.each<[AvatarSize, number]>([
    ['sm', 24],
    ['md', 32],
    ['lg', 40],
    ['xl', 80],
    ['xxl', 120],
  ])('applies %s size as %dpx width and height for both image and fallback', (size, px) => {
    const { rerender } = render(
      <Avatar name="Margaret Hamilton" src="https://example.com/margaret.png" size={size} />,
    );

    const img = screen.getByRole('img', { name: 'Margaret Hamilton avatar' });
    expect(img).toHaveStyle({ width: `${px}px`, height: `${px}px` });

    rerender(<Avatar name="Margaret Hamilton" size={size} />);

    const fallback = screen.getByRole('img', { name: 'Margaret Hamilton avatar' });
    expect(fallback).toHaveStyle({ width: `${px}px`, height: `${px}px` });
  });

  it('defaults to lg size (40px) and forwards className', () => {
    render(<Avatar name="Linus Torvalds" className="custom-avatar" />);

    const fallback = screen.getByRole('img', { name: 'Linus Torvalds avatar' });
    expect(fallback).toHaveStyle({ width: '40px', height: '40px' });
    expect(fallback).toHaveClass('custom-avatar');
  });
});
