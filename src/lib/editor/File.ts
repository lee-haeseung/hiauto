import { Node, mergeAttributes } from '@tiptap/core';

export interface FileOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    file: {
      setFile: (options: { src: string; fileName: string }) => ReturnType;
    };
  }
}

export const File = Node.create<FileOptions>({
  name: 'file',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      fileName: {
        default: 'file',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'file',
        class: 'file-attachment',
      }),
      [
        'a',
        {
          href: HTMLAttributes.src,
          download: HTMLAttributes.fileName,
          target: '_blank',
          class: 'file-link',
          style:
            'display: inline-flex; align-items: center; gap: 8px; padding: 12px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; text-decoration: none; color: #374151; font-weight: 500;',
        },
        [
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '20',
            height: '20',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
          [
            'path',
            {
              d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
            },
          ],
          ['polyline', { points: '14 2 14 8 20 8' }],
        ],
        ['span', {}, HTMLAttributes.fileName],
      ],
    ];
  },

  addCommands() {
    return {
      setFile:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
