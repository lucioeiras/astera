import { NodeSelection, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import type { Node } from '@milkdown/kit/prose/model';
import { closeHistory } from '@milkdown/kit/prose/history';

export type NoteBlock = { from: number; to: number; node: Node; index: number };

export function noteBlocks(doc: Node): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  doc.forEach((node, from, index) => blocks.push({ from, to: from + node.nodeSize, node, index }));
  return blocks;
}

/** Move the existing node in one transaction: marks, images, nested lists and
 * unknown Markdown stay intact, and undo restores the complete operation. */
export function moveNoteBlock(state: EditorState, from: number, boundary: number) {
  const blocks = noteBlocks(state.doc);
  const block = blocks.find((entry) => entry.from === from);
  if (
    !block ||
    !Number.isInteger(boundary) ||
    ![...blocks.map((entry) => entry.from), state.doc.content.size].includes(boundary) ||
    boundary === block.from ||
    boundary === block.to
  )
    return null;
  const tr = state.tr.delete(block.from, block.to);
  const target = tr.mapping.map(boundary, -1);
  tr.insert(target, block.node);
  tr.setSelection(NodeSelection.create(tr.doc, target));
  return closeHistory(tr).scrollIntoView();
}

export function deleteNoteBlock(state: EditorState, from: number) {
  const block = noteBlocks(state.doc).find((entry) => entry.from === from);
  if (!block) return null;
  // ProseMirror supplies an empty paragraph when deleting the only block.
  const tr = state.tr.delete(block.from, block.to);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(block.from, tr.doc.content.size))));
  return closeHistory(tr).scrollIntoView();
}

export function blockTextSelection(state: EditorState, block: NoteBlock) {
  if (block.node.isAtom) return NodeSelection.create(state.doc, block.from);
  return TextSelection.between(state.doc.resolve(block.from + 1), state.doc.resolve(block.to - 1));
}

export function canFormatBlock(block: NoteBlock) {
  return ['paragraph', 'heading', 'bullet_list', 'ordered_list', 'blockquote'].includes(
    block.node.type.name
  );
}
