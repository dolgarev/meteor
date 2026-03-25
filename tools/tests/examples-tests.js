import { validateExamplesData } from '../cli/examples.js';
import assert from 'assert';

describe('validateExamplesData', () => {
  it('returns valid entries unchanged', () => {
    const data = [
      { slug: 'foo', repositoryUrl: 'https://github.com/a/b', title: 'Foo', why: 'test', stack: ['Meteor'], meteorVersion: '3.4', isInternal: false, internalPath: null, repository: 'a/b', demo: null, lastUpdatedAt: null }
    ];
    const result = validateExamplesData(data);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].slug, 'foo');
  });

  it('skips entries missing slug', () => {
    const data = [
      { repositoryUrl: 'https://github.com/a/b' },
      { slug: 'valid', repositoryUrl: 'https://github.com/c/d' }
    ];
    const result = validateExamplesData(data);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].slug, 'valid');
  });

  it('skips entries missing repositoryUrl', () => {
    const data = [
      { slug: 'no-url' },
      { slug: 'valid', repositoryUrl: 'https://github.com/c/d' }
    ];
    const result = validateExamplesData(data);
    assert.strictEqual(result.length, 1);
  });

  it('throws on non-array input', () => {
    assert.throws(() => validateExamplesData('not an array'), /Invalid/);
    assert.throws(() => validateExamplesData(null), /Invalid/);
    assert.throws(() => validateExamplesData({}), /Invalid/);
  });
});
