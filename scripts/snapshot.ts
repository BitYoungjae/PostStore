import ora from 'ora';
import chalk from 'chalk';

const command = process.argv[2];
const secondArgv = process.argv[3];
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
  } else if (command === 'pick') {
    await pick(secondArgv);
  }
};

const update = async () => {
  const spinner = ora('스냅샷 업데이트 시작').start();
  const snapshotList = (await import('./snapshotList')).default;
  for (const generator of snapshotList) {
    const generatorName = !generator.name ? '익명 제너레이터' : generator.name;

    try {
      await generator(true);
    } catch (e) {
      spinner.fail(chalk`{red.bold ${generatorName} 오류 발생}`);
      console.log(e);
      continue;
    }

    spinner.info(chalk`{blue.bold ${generatorName}} 스냅샷 생성완료.`);
  }

  spinner.succeed(chalk`{green 생성 완료}`);
};

const test = async () => {
  const spinner = ora('스냅샷 테스트 시작').start();
  const snapshotList = (await import('./snapshotList')).default;

  const testResultList: boolean[] = [];

  for (const generator of snapshotList) {
    const generatorName = !generator.name ? '익명 제너레이터' : generator.name;
    let error: any;

    try {
      const testResult = await generator(false);
      testResultList.push(testResult);

      if (testResult) {
        spinner.succeed(
          chalk`{green.bold ${generatorName}} 스냅샷 테스트 성공`,
        );
        continue;
      }
    } catch (e) {
      error = e;
      testResultList.push(false);
    }

    spinner.fail(chalk`{red.bold ${generatorName}} 스냅샷 테스트 실패`);
    if (error) console.log(error);
  }

  if (testResultList.every((result) => result === true)) {
    spinner.succeed(chalk`{green.bold 전체 테스트 성공}`);
    return;
  }
};

const pick = async (name: string) => {
  const spinner = ora(`${name} 테스트 시작`).start();
  const snapshotList = (await import('./snapshotList')).default;
  const pickedGenerator = snapshotList.find(
    (generator) => generator.name === name,
  );

  if (!pickedGenerator) {
    spinner.stop();
    return;
  }

  const testResult = await pickedGenerator();

  spinner.info(pickedGenerator.name);

  if (testResult === true) {
    spinner.succeed('성공');
    return;
  }

  spinner.fail('실패');
};

main();
