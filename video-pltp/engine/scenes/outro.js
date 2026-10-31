// outro.js — penutup: 'summary' = peta Indonesia menyala; 'end' = globe dengan inti berdenyut.
import * as indomap from './indomap.js';
import * as earth from './earth.js';
export async function create(ctx) {
  const mode = ctx.entry.params.mode;
  if (mode === 'end') { const e = Object.assign(Object.create(Object.getPrototypeOf(ctx.entry)), ctx.entry, { params: { mode: 'end' } }); return earth.create({ ...ctx, entry: e }); }
  const e = Object.assign({}, ctx.entry, { params: { mode: 'summary' } }); return indomap.create({ ...ctx, entry: e });
}
