import { slugify } from '../src/lib/slugify';

test('slugify test', () => {
  expect(slugify('반가운 얼굴들 안녕')).toBe('반가운-얼굴들-안녕');

  expect(slugify('😄 반가운 얼굴들 안녕')).toBe('반가운-얼굴들-안녕');

  expect(slugify('반가운 😄 얼굴들 안녕')).toBe('반가운-얼굴들-안녕');

  expect(slugify('   반가운     얼굴들      !!@@ 안녕   ')).toBe(
    '반가운-얼굴들-안녕',
  );

  expect(
    slugify(
      '  ㄹㅁㄴㅇㄹㅁㄴㄹ 반가운   ㄹㅁㄴㅇ  얼굴들  ㄹㄴㅇㄹㅇㄴㄹ    !!@@ 안녕   ',
    ),
  ).toBe('반가운-얼굴들-안녕');

  expect(slugify('tsconfig.json을 이용해 타입스크립트 설정을 해보자!!')).toBe(
    'tsconfig.json을-이용해-타입스크립트-설정을-해보자',
  );

  expect(slugify('package-lock.json 을 꼭 포함해주세요')).toBe(
    'package-lock.json-을-꼭-포함해주세요',
  );

  expect(slugify('Testing Asynchronous Code')).toBe(
    'Testing-Asynchronous-Code',
  );
});
