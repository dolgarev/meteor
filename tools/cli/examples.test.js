const { validateExamplesData } = require('./examples.js');

describe('validateExamplesData', () => {
  it('returns valid entries unchanged', () => {
    const data = [
      { slug: 'foo', repositoryUrl: 'https://github.com/a/b', title: 'Foo', why: 'test', stack: ['Meteor'], meteorVersion: '3.4', isInternal: false, internalPath: null, repository: 'a/b', demo: null, lastUpdatedAt: null }
    ];
    const result = validateExamplesData(data);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('foo');
  });

  it('skips entries missing slug', () => {
    const data = [
      { repositoryUrl: 'https://github.com/a/b' },
      { slug: 'valid', repositoryUrl: 'https://github.com/c/d' }
    ];
    const result = validateExamplesData(data);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('valid');
  });

  it('skips entries missing repositoryUrl', () => {
    const data = [
      { slug: 'no-url' },
      { slug: 'valid', repositoryUrl: 'https://github.com/c/d' }
    ];
    const result = validateExamplesData(data);
    expect(result).toHaveLength(1);
  });

  it('throws on non-array input', () => {
    expect(() => validateExamplesData('not an array')).toThrow(/Invalid/);
    expect(() => validateExamplesData(null)).toThrow(/Invalid/);
    expect(() => validateExamplesData({})).toThrow(/Invalid/);
  });
});
