// Unit tests for splitQuotedArgs — the SERVER_NODE_OPTIONS parser in run-app.js
//
// splitQuotedArgs is not exported directly, so we extract and test an identical
// copy.  Keep this in sync with the implementation in run-app.js.

// --- Copy of splitQuotedArgs from run-app.js ---
var splitQuotedArgs = function (s) {
  const args = [];
  let current = '';
  let inDouble = false;
  let inSingle = false;
  let escaped = false;
  let hasQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    // Backslash: escape next char in double quotes or unquoted context
    if (ch === '\\' && !inSingle) {
      escaped = true;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      hasQuotes = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      hasQuotes = true;
      continue;
    }

    if (/\s/.test(ch) && !inDouble && !inSingle) {
      if (current || hasQuotes) {
        args.push(current);
        current = '';
        hasQuotes = false;
      }
      continue;
    }

    current += ch;
  }

  if (current || hasQuotes) {
    args.push(current);
  }

  if (inDouble || inSingle) {
    throw new Error(
      "Unterminated quote in SERVER_NODE_OPTIONS: " + s
    );
  }

  return args;
};

// --- Tests ---

describe('splitQuotedArgs', () => {
  // These pass with the current implementation
  describe('existing behavior (should keep working)', () => {
    test('empty string returns empty array', () => {
      expect(splitQuotedArgs('')).toEqual([]);
    });

    test('simple flags split on whitespace', () => {
      expect(splitQuotedArgs('--inspect --max-old-space-size=4096')).toEqual([
        '--inspect',
        '--max-old-space-size=4096',
      ]);
    });

    test('multiple spaces between args', () => {
      expect(splitQuotedArgs('  --a   --b  ')).toEqual(['--a', '--b']);
    });
  });

  // These FAILED before the fix — now they should pass
  describe('quoted values (previously broken)', () => {
    test('double-quoted value', () => {
      expect(splitQuotedArgs('--test-name-pattern="validation"')).toEqual([
        '--test-name-pattern=validation',
      ]);
    });

    test('single-quoted value', () => {
      expect(splitQuotedArgs("--test-name-pattern='validation'")).toEqual([
        '--test-name-pattern=validation',
      ]);
    });

    test('double-quoted value with spaces', () => {
      expect(splitQuotedArgs('--test-name-pattern="my pattern"')).toEqual([
        '--test-name-pattern=my pattern',
      ]);
    });

    test('mixed quoted and unquoted args', () => {
      expect(splitQuotedArgs('--inspect --test-reporter="my reporter" --once')).toEqual([
        '--inspect',
        '--test-reporter=my reporter',
        '--once',
      ]);
    });

    test('escaped quote inside double quotes', () => {
      expect(splitQuotedArgs('--pattern="say \\"hello\\""')).toEqual([
        '--pattern=say "hello"',
      ]);
    });

    test('single quotes preserve double quotes literally', () => {
      expect(splitQuotedArgs("--pattern='say \"hello\"'")).toEqual([
        '--pattern=say "hello"',
      ]);
    });

    test('unterminated double quote throws', () => {
      expect(() => splitQuotedArgs('--flag="unterminated')).toThrow(
        /Unterminated quote/
      );
    });

    test('unterminated single quote throws', () => {
      expect(() => splitQuotedArgs("--flag='unterminated")).toThrow(
        /Unterminated quote/
      );
    });
  });

  // Edge cases raised during review
  describe('edge cases', () => {
    test('empty double-quoted arg is preserved', () => {
      expect(splitQuotedArgs('--foo ""')).toEqual(['--foo', '']);
    });

    test('empty single-quoted arg is preserved', () => {
      expect(splitQuotedArgs("--foo ''")).toEqual(['--foo', '']);
    });

    test('backslash-escaped space outside quotes', () => {
      expect(splitQuotedArgs('--foo hello\\ world')).toEqual([
        '--foo',
        'hello world',
      ]);
    });

    test('concatenated double-quoted segments', () => {
      expect(splitQuotedArgs('"abc""def"')).toEqual(['abcdef']);
    });

    test('concatenated single-quoted segments', () => {
      expect(splitQuotedArgs("'abc''def'")).toEqual(['abcdef']);
    });
  });

  // Real-world SERVER_NODE_OPTIONS combinations
  describe('real-world examples', () => {
    test('node:test coverage + reporter', () => {
      expect(splitQuotedArgs(
        '--experimental-test-coverage --test-reporter=spec'
      )).toEqual([
        '--experimental-test-coverage',
        '--test-reporter=spec',
      ]);
    });

    test('multi-reporter setup', () => {
      expect(splitQuotedArgs(
        '--test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=./results.xml'
      )).toEqual([
        '--test-reporter=spec',
        '--test-reporter-destination=stdout',
        '--test-reporter=junit',
        '--test-reporter-destination=./results.xml',
      ]);
    });
  });
});
