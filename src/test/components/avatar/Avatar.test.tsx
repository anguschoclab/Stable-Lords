// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Avatar } from '@/components/avatar/Avatar';
import { createTestAvatarData } from '@/test/_fixtures/avatarData';

describe('Avatar', () => {
  it('renders all layers as img tags in z-order', () => {
    const portrait = createTestAvatarData();
    const { container } = render(<Avatar portrait={portrait} size="md" />);
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(portrait.layers.length);
  });

  it('applies the correct dimensions for named sizes', () => {
    const { container } = render(<Avatar portrait={createTestAvatarData()} size="sm" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
  });

  it('applies pixelated image rendering', () => {
    const { container } = render(<Avatar portrait={createTestAvatarData()} size="md" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.imageRendering).toBe('pixelated');
  });

  it('uses the explicit numeric size when provided', () => {
    const { container } = render(<Avatar portrait={createTestAvatarData()} size={120} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('120px');
  });

  it('sorts layers by z-index', () => {
    const portrait = createTestAvatarData({
      layers: [
        { category: 'hair', src: '/hair.png', z: 5 },
        { category: 'base', src: '/base.png', z: 1 },
        { category: 'eyes', src: '/eyes.png', z: 3 },
      ],
    });
    const { container } = render(<Avatar portrait={portrait} size="md" />);
    const images = container.querySelectorAll('img');
    expect(images[0]?.getAttribute('src')).toBe('/base.png');
    expect(images[1]?.getAttribute('src')).toBe('/eyes.png');
    expect(images[2]?.getAttribute('src')).toBe('/hair.png');
  });
});
