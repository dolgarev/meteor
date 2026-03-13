// Unit tests for bashParse — the SERVER_NODE_OPTIONS parser in run-app.js
//
// bashParse is not exported directly, so we extract and test an identical
// copy.  Keep this in sync with the implementation in run-app.js.

// --- Copy of bashParse from run-app.js (fixed version) ---
var bashParse = function (s) {
  const args = [];
  let current = '';
  let inDouble = false;
  let inSingle = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\' && inDouble) {
      escaped = true;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (/\s/.test(ch) && !inDouble && !inSingle) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current) {
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

describe('bashParse', () => {
  // These pass with the current implementation
  describe('existing behavior (should keep working)', () => {
    test('empty string returns empty array', () => {
      expect(bashParse('')).toEqual([]);
    });

    test('simple flags split on whitespace', () => {
      expect(bashParse('--inspect --max-old-space-size=4096')).toEqual([
        '--inspect',
        '--max-old-space-size=4096',
      ]);
    });

    test('multiple spaces between args', () => {
      expect(bashParse('  --a   --b  ')).toEqual(['--a', '--b']);
    });
  });

  // These FAILED before the fix — now they should pass
  describe('quoted values (previously broken)', () => {
    test('double-quoted value', () => {
      expect(bashParse('--test-name-pattern="validation"')).toEqual([
        '--test-name-pattern=validation',
      ]);
    });

    test('single-quoted value', () => {
      expect(bashParse("--test-name-pattern='validation'")).toEqual([
        '--test-name-pattern=validation',
      ]);
    });

    test('double-quoted value with spaces', () => {
      expect(bashParse('--test-name-pattern="my pattern"')).toEqual([
        '--test-name-pattern=my pattern',
      ]);
    });

    test('mixed quoted and unquoted args', () => {
      expect(bashParse('--inspect --test-reporter="my reporter" --once')).toEqual([
        '--inspect',
        '--test-reporter=my reporter',
        '--once',
      ]);
    });

    test('escaped quote inside double quotes', () => {
      expect(bashParse('--pattern="say \\"hello\\""')).toEqual([
        '--pattern=say "hello"',
      ]);
    });

    test('single quotes preserve double quotes literally', () => {
      expect(bashParse("--pattern='say \"hello\"'")).toEqual([
        '--pattern=say "hello"',
      ]);
    });

    test('unterminated double quote throws', () => {
      expect(() => bashParse('--flag="unterminated')).toThrow(
        /Unterminated quote/
      );
    });

    test('unterminated single quote throws', () => {
      expect(() => bashParse("--flag='unterminated")).toThrow(
        /Unterminated quote/
      );
    });
  });

  // Real-world SERVER_NODE_OPTIONS combinations
  describe('real-world examples', () => {
    test('node:test coverage + reporter', () => {
      expect(bashParse(
        '--experimental-test-coverage --test-reporter=spec'
      )).toEqual([
        '--experimental-test-coverage',
        '--test-reporter=spec',
      ]);
    });

    test('multi-reporter setup', () => {
      expect(bashParse(
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
