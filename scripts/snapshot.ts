import ora from 'ora';
import chalk from 'chalk';

const command = process.argv[2];
const hr = '\u001b[2m──────────────\u001b[22m';

const main = async () => {
  if (command === 'update') {
    await update();
  } else if (command === 'test') {
    await test();
  } else if (command === 'all') {
    await test();
    console.log(hr);
    await update();
  }
};

const update = async () => {
  const spinner = ora('스냅샷 업데이트 시작').start();
  const snapshotList = (await import('./snapshotList')).default;
  for (const generator of snapshotList) {
    const generatorName = !generator.name ? '익명 제너레이터' : generator.name;

    await generator(true);
    spinner.info(chalk`{blue.bold ${generatorName}} 스냅샷 생성완료.`);
  }

  spinner.succeed(chalk`{green 전체 스냅샷 생성 완료}`);
};

const test = async () => {
  const spinner = ora('스냅샷 테스트 시작').start();
  const snapshotList = (await import('./snapshotList')).default;

  const testResultList: boolean[] = [];

  for (const generator of snapshotList) {
    const generatorName = !generator.name ? '익명 제너레이터' : generator.name;

    const testResult = await generator(false);
    testResultList.push(testResult);

    if (testResult) {
      spinner.succeed(chalk`{green.bold ${generatorName}} 스냅샷 테스트 성공`);
      continue;
    }

    spinner.fail(chalk`{red.bold ${generatorName}} 스냅샷 테스트 실패`);
  }

  if (testResultList.every((result) => result === true)) {
    spinner.succeed(chalk`{green.bold 전체 테스트 성공}`);
    return;
  }
};

// 테스트 환경으로 설정
globalThis.__DEV__ = true;

main();
