import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import arrow from '../assets/arrow.svg';
import wallet from '../assets/wallet.svg';
import pumpArrow from '../assets/Icon (5).svg';
import user from '../assets/Icon (4).svg';

const meta = {
  title: 'Common/Icon',
  component: Icon,
  tags: ['autodocs'],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

const icons = [
    { name: 'arrow.svg', src: arrow },
    { name: 'wallet.svg', src: wallet },
    { name: 'Icon (5).svg (pumpArrow)', src: pumpArrow },
    { name: 'Icon (4).svg (user)', src: user },
];

export const RTLMirrorAudit: Story = {
  render: () => (
    <div>
        <h2>LTR Direction (Default)</h2>
        <div dir="ltr" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {icons.map((icon) => (
                <div key={icon.name} style={{ textAlign: 'center' }}>
                    <Icon src={icon.src} alt={icon.name} />
                    <p>{icon.name}</p>
                </div>
            ))}
        </div>

        <h2>RTL Direction</h2>
        <div dir="rtl" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {icons.map((icon) => (
                <div key={icon.name} style={{ textAlign: 'center' }}>
                    <Icon src={icon.src} alt={icon.name} />
                    <p>{icon.name}</p>
                </div>
            ))}
        </div>

        <h2>Edge Cases (RTL)</h2>
        <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <h3>Inside Buttons</h3>
                <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <Icon src={arrow} alt="arrow" />
                    Next Step (RTL text here)
                </button>
            </div>
            <div>
                <h3>Inside Badges</h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#eee', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>
                    <Icon src={wallet} alt="wallet" />
                    Premium
                </span>
            </div>
            <div>
                <h3>Mixed LTR/RTL Text Run</h3>
                <p>
                    Here is some LTR text followed by <Icon src={pumpArrow} alt="trend" /> and then some RTL context logic.
                </p>
            </div>
        </div>
    </div>
  ),
};
