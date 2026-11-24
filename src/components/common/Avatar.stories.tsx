import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, type AvatarSize } from './Avatar';

const SAMPLE_AVATAR_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0f766e"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><circle cx="40" cy="30" r="14" fill="#f8fafc"/><path d="M16 70c4-14 14-20 24-20s20 6 24 20" fill="#f8fafc"/></svg>'
  );

const AVATAR_SIZES: AvatarSize[] = ['sm', 'md', 'lg', 'xl', 'xxl'];

const meta: Meta<typeof Avatar> = {
  title: 'Components/Common/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    name: 'Ada Lovelace',
    size: 'lg',
  },
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL. When omitted or on load error, initials fallback is shown.',
    },
    name: {
      control: 'text',
      description: 'Name used for initials fallback and deterministic gradient color.',
    },
    size: {
      control: 'select',
      options: AVATAR_SIZES,
      description: 'Avatar size.',
    },
    className: {
      control: 'text',
      description: 'Optional className for additional styling.',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image (defaults to `${name} avatar`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {AVATAR_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Avatar name="Ada Lovelace" size={size} />
          <span className="text-xs text-slate-300">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const ImageSrc: Story = {
  args: {
    src: SAMPLE_AVATAR_DATA_URI,
    name: 'Ada Lovelace',
    size: 'xl',
    alt: 'Ada Lovelace profile photo',
  },
};

export const InitialsFallback: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name="Ada Lovelace" size="lg" />
      <Avatar name="Grace Hopper" size="lg" />
      <Avatar name="Alan Turing" size="lg" />
      <Avatar name="Stellar" size="lg" />
    </div>
  ),
};

export const BrokenImage: Story = {
  args: {
    src: '/nonexistent-avatar-image.png',
    name: 'Grace Hopper',
    size: 'xl',
  },
};
